import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as zlib from "zlib";
import { namespaces, starlarkExecutableGithubRepository, vsCommands } from "@constants";
import { translate } from "@i18n";
import { AssetInfo, GitHubRelease } from "@interfaces";
import { LoggerService } from "@services";
import axios from "axios";
import * as tar from "tar";
import { commands, workspace, window, ExtensionContext } from "vscode";
const getPlatformIdentifier = (platform: string, arch: string): string => {
	switch (platform) {
		case "darwin":
			switch (arch) {
				case "arm64":
					return "autokitteh-starlark-lsp_Darwin_arm64.tar.gz";
				case "x64":
					return "autokitteh-starlark-lsp_Darwin_x64.tar.gz";
				default:
					return "unsupported";
			}
		case "linux":
			switch (arch) {
				case "arm64":
					return "autokitteh-starlark-lsp_Linux_arm64.tar.gz";
				case "x64":
					return "autokitteh-starlark-lsp_Linux_x64.tar.gz";
				default:
					return "unsupported";
			}
		case "win32":
			switch (arch) {
				case "x64":
					return "autokitteh-starlark-lsp_Windows_x64.tar.gz";
				case "ia32":
					return "autokitteh-starlark-lsp_Windows_ia32.tar.gz";
				default:
					return "unsupported";
			}
		default:
			return "unsupported";
	}
};

export const getAssetByPlatform = (data: GitHubRelease, platform: string, arch: string): AssetInfo | undefined => {
	const enrichedPlatform = getPlatformIdentifier(platform, arch);
	if (enrichedPlatform === "unsupported") {
		commands.executeCommand(
			vsCommands.showErrorMessage,
			namespaces.startlarkLSPServer,
			translate().t("errors.starlarkPlatformNotSupported")
		);
	}
	const latestRelease = data.data[data.data.length - 1];
	const asset = latestRelease.assets.find((asset) => asset.name.includes(enrichedPlatform));

	return asset
		? {
				url: asset.browser_download_url,
				tag: latestRelease.tag_name,
			}
		: undefined;
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

export const extractTarGz = async (filePath: string, outputDir: string): Promise<void> => {
	return new Promise((resolve, reject) => {
		fs.createReadStream(filePath)
			.pipe(zlib.createGunzip())
			.pipe(tar.extract({ cwd: outputDir }))
			.on("close", resolve)
			.on("error", reject);
	});
};

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
	await extractTarGz(`${extensionPath}/${fileName}`, extensionPath).catch((error) => {
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
