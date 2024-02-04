import { exec } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as util from "util";
import * as zlib from "zlib";
import { namespaces, starlarkExecutableGithubRepository, vsCommands } from "@constants";
import { translate } from "@i18n";
import { Asset, AssetInfo, GitHubRelease } from "@interfaces";
import { LoggerService } from "@services";
import AdmZip from "adm-zip";
import axios from "axios";
import * as tarFs from "tar-fs";
import { commands, workspace, window, ExtensionContext } from "vscode";

const execPromise = util.promisify(exec);

function getArchiveType(filename: string): string {
	const ext = path.extname(filename).toLowerCase();
	if (ext === ".xz") {
		return "tar.xz";
	}
	if (ext === ".gz") {
		return "tar.gz";
	}
	if (ext === ".tar") {
		return "tar";
	}
	if (ext === ".zip") {
		return "zip";
	}
	return "unknown";
}

async function extractXzFile(inputPath: string, outputPath: string): Promise<string | undefined> {
	if (!fs.existsSync(outputPath)) {
		fs.mkdirSync(outputPath, { recursive: true });
	}

	const outputFilePath = path.join(outputPath, path.basename(inputPath, ".xz"));
	const command = `xz -d -k -f -c "${inputPath}" > "${outputFilePath}"`;

	try {
		await execPromise(command);
		console.log(`Successfully extracted ${inputPath} to ${outputFilePath}`);
		return outputFilePath;
	} catch (error) {
		console.error("Extraction failed:", error);
		return undefined;
	}
}

function extractTarGz(inputPath: string, outputPath: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const decompressor = zlib.createGunzip();
		const input = fs.createReadStream(inputPath);
		const output = tarFs.extract(outputPath);

		input.pipe(decompressor).pipe(output).on("finish", resolve).on("error", reject);
	});
}

// Extract tar
function extractTar(inputPath: string, outputPath: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const input = fs.createReadStream(inputPath);
		const output = tarFs.extract(outputPath);

		input.pipe(output).on("finish", resolve).on("error", reject);
	});
}

// Extract zip
function extractZip(inputPath: string, outputPath: string): Promise<void> {
	return new Promise((resolve, reject) => {
		try {
			const zip = new AdmZip(inputPath);
			zip.extractAllTo(outputPath, true);
			resolve();
		} catch (error) {
			reject(error);
		}
	});
}

async function extractArchive(inputPath: string, outputPath: string) {
	const type = getArchiveType(inputPath);

	switch (type) {
		case "tar.xz":
			const tarPath = await extractXzFile(inputPath, outputPath);
			if (tarPath) {
				return extractTar(tarPath, outputPath);
			}
			break;
		case "tar.gz":
			return extractTarGz(inputPath, outputPath);
			break;
		case "tar":
			return extractTar(inputPath, outputPath);
			break;
		case "zip":
			return extractZip(inputPath, outputPath);
			break;
		default:
			console.error("Unsupported file type");
	}
}

export const getAssetByPlatform = (data: GitHubRelease, platform: string, arch: string): AssetInfo | undefined => {
	const enrichedPlatform = `autokitteh-starlark-lsp_${platform}_${arch}`;
	const latestRelease = data.data[data.data.length - 1];
	const asset: Asset | undefined = latestRelease.assets.find((asset: Asset) => asset.name.includes(enrichedPlatform));

	if (!asset) {
		commands.executeCommand(
			vsCommands.showErrorMessage,
			namespaces.startlarkLSPServer,
			translate().t("errors.starlarkPlatformNotSupported")
		);
		return;
	}

	return {
		url: asset.browser_download_url,
		tag: latestRelease.tag_name,
	};
};

export const getLatestRelease = async (platform: string, arch: string): Promise<AssetInfo | undefined> => {
	try {
		const response = await axios.get(starlarkExecutableGithubRepository);
		return getAssetByPlatform(response, platform, arch);
	} catch (error) {
		const errorMessage = translate().t("errors.fetchingReleaseInfo", { error: (error as Error).message });
		LoggerService.error(namespaces.startlarkLSPServer, errorMessage);
		commands.executeCommand(vsCommands.showErrorMessage, errorMessage);
		return undefined;
	}
};

export const getFileNameFromUrl = (downloadUrl: string): string => path.basename(new URL(downloadUrl).pathname);

export const downloadAndSaveFile = async (url: string, filePath: string): Promise<void> => {
	try {
		const response = await axios.get(url, { responseType: "stream" });
		const writer = fs.createWriteStream(filePath);
		response.data.pipe(writer);
		return new Promise((resolve, reject) => {
			writer.on("close", resolve);
			writer.on("error", (err) => {
				writer.close();
				reject(err);
			});
		});
	} catch (error) {
		const errorMessage = translate().t("errors.fetchingReleaseInfo", { error: (error as Error).message });
		LoggerService.error(namespaces.startlarkLSPServer, errorMessage);
		commands.executeCommand(vsCommands.showErrorMessage, errorMessage);
	}
};

export const getNewVersion = async (
	extensionContext: ExtensionContext,
	release?: AssetInfo
): Promise<string | undefined> => {
	if (!release) {
		return undefined;
	}

	const fileName = getFileNameFromUrl(release.url);
	const extensionPath = extensionContext.extensionPath;
	await downloadAndSaveFile(release.url, `${extensionPath}/${fileName}`);
	await extractArchive(`${extensionPath}/${fileName}`, extensionPath).catch((error) => {
		const errorMessage = translate().t("errors.issueExtractLSP", { error: (error as Error).message });
		LoggerService.error(namespaces.starlarkLSPExecutable, errorMessage);
		commands.executeCommand(vsCommands.showErrorMessage, namespaces.starlarkLSPExecutable, errorMessage);
	});

	const lspPath = `${extensionPath}/autokitteh-starlark-lsp`;

	extensionContext.workspaceState.update("autokitteh.starlarkLSPPath", lspPath);
	extensionContext.workspaceState.update("autokitteh.starlarkLSPVersion", release.tag);

	commands.executeCommand(
		vsCommands.showInfoMessage,
		namespaces.startlarkLSPServer,
		translate().t("starlark.executableDownloadedSuccessfully")
	);
	LoggerService.info(namespaces.startlarkLSPServer, translate().t("starlark.executableDownloadedSuccessfully"));

	return lspPath;
};

export const downloadExecutable = async (extensionContext: ExtensionContext): Promise<string | undefined> => {
	const platform = os.platform();
	const arch = os.arch();
	const release = await getLatestRelease(platform, arch);

	const currentLSPVersion = workspace.getConfiguration().get<string>("autokitteh.starlarkLSPVersion");
	if (release && currentLSPVersion !== release.tag) {
		const userResponse = await window.showInformationMessage(
			translate().t("starlark.downloadExecutableDialog"),
			"Yes",
			"No"
		);
		if (userResponse === "Yes") {
			return await getNewVersion(extensionContext, release);
		}
	}
};
