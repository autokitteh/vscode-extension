import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as zlib from "zlib";
import { namespaces, vsCommands } from "@constants";
import { translate } from "@i18n";
import { AssetInfo, GitHubRelease } from "@interfaces";
import { LoggerService } from "@services";
import axios from "axios";
import * as tar from "tar";
import { commands, workspace, window } from "vscode";

export const getAssetByPlatform = (data: GitHubRelease, platform: string): AssetInfo | undefined => {
	let enrichedPlatform = "Darwin_arm64";

	if (platform === "darwin") {
		enrichedPlatform = "Darwin_arm64";
	}

	const tagVersion = data.data[data.data.length - 1].tag_name;

	const asset =
		data.data[data.data.length - 1].assets.find((asset) => asset.name.indexOf(enrichedPlatform) !== -1) || undefined;

	if (!asset) {
		return;
	}

	return {
		url: asset.browser_download_url as string,
		tag: tagVersion as string,
	};
};

export const getLatestRelease = async (platform: string): Promise<void | AssetInfo> => {
	return axios
		.get("https://api.github.com/repos/autokitteh/autokitteh-starlark-lsp/releases")
		.then((data) => {
			const asset = getAssetByPlatform(data, platform);

			return asset;
		})
		.catch((error) => {
			commands.executeCommand(vsCommands.showErrorMessage, namespaces.starlarkLSPExecutable, error);
		});
};

export const getFileNameFromUrl = (downloadUrl: string): string => {
	const url = new URL(downloadUrl);
	return path.basename(url.pathname);
};

export const extractTarGz = (filePath: string, outputDir: string): Promise<void> => {
	return new Promise((resolve, reject) => {
		fs.createReadStream(filePath)
			.pipe(zlib.createGunzip())
			.on("error", reject)
			.pipe(tar.extract({ cwd: outputDir }))
			.on("close", resolve)
			.on("error", reject);
	});
};

export const downloadAndSaveFile = async (url: string, filePath: string): Promise<void> => {
	return new Promise((resolve, reject) => {
		axios
			.get(url, { responseType: "stream" })
			.then((response) => {
				const writer = fs.createWriteStream(filePath);
				response.data.pipe(writer);
				let error: Error | null = null;
				writer.on("error", (err) => {
					error = err;
					writer.close();
					reject(err);
				});
				writer.on("close", () => {
					if (!error) {
						resolve();
					}
				});
			})
			.catch((error) => {
				reject(error);
			});
	});
};

export const getNewVersion = async (extensionPath: string, release: void | AssetInfo) => {
	if (!release) {
		return;
	}

	if (extensionPath) {
		const fileName = getFileNameFromUrl(release.url);
		await downloadAndSaveFile(release.url, `${extensionPath}/${fileName}`);
		try {
			await extractTarGz(`${extensionPath}/${fileName}`, `${extensionPath}`);
		} catch (error) {
			commands.executeCommand(vsCommands.showErrorMessage, namespaces.starlarkLSPExecutable, (error as Error).message);
			LoggerService.error(namespaces.deploymentsService, (error as Error).message);
			return;
		}
		workspace.getConfiguration().update("autokitteh.starlarkLSPPath", `${extensionPath}/autokitteh-starlark-lsp`);
		workspace.getConfiguration().update("autokitteh.starlarkLSPVersion", release.tag);

		commands.executeCommand(
			vsCommands.showInfoMessage,
			namespaces.startlarkLSPServer,
			translate().t("starlark.executableDownloadedSuccefully")
		);
		return;
	}
	const error = translate().t("errors.issueGettingLSP");
	commands.executeCommand(vsCommands.showErrorMessage, namespaces.starlarkLSPExecutable, error);
	LoggerService.error(namespaces.deploymentsService, error);
};

export const downloadExecutable = async (extensionPath: string) => {
	let platform = os.platform();

	const release = await getLatestRelease(platform);

	const currentLSPVersion = workspace.getConfiguration().get("autokitteh.starlarkLSPVersion");
	if (currentLSPVersion) {
		if (release && currentLSPVersion !== release.tag) {
			await getNewVersion(extensionPath, release);
		}
		return;
	}

	const userResponse = await window.showInformationMessage(
		translate().t("starlark.downloadExecutableDialog"),
		"Yes",
		"No"
	);

	if (userResponse === "Yes") {
		getNewVersion(extensionPath, release);
	}
};
