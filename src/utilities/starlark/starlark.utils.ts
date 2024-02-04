import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { namespaces, starlarkExecutableGithubRepository, vsCommands } from "@constants";
import { translate } from "@i18n";
import { Asset, AssetInfo, GitHubRelease } from "@interfaces";
import { LoggerService } from "@services";
import { extractArchive } from "@utilities";
import axios from "axios";
import { commands, workspace, window, ExtensionContext } from "vscode";

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
	LoggerService.info(namespaces.startlarkLSPServer, translate().t("starlark.executableDownloadedUnpacking"));

	await extractArchive(`${extensionPath}/${fileName}`, extensionPath).catch((error) => {
		const errorMessage = translate().t("errors.issueExtractLSP", { error: (error as Error).message });
		LoggerService.error(namespaces.starlarkLSPExecutable, errorMessage);
		commands.executeCommand(vsCommands.showErrorMessage, namespaces.starlarkLSPExecutable, errorMessage);
	});
	const lspPath = `${extensionPath}/autokitteh-starlark-lsp`;

	if (!fs.existsSync(lspPath)) {
		LoggerService.info(namespaces.startlarkLSPServer, translate().t("errors.errorInstallingLSP"));
		return;
	}

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
			LoggerService.info(namespaces.startlarkLSPServer, translate().t("starlark.downloadExecutableInProgress"));

			return await getNewVersion(extensionContext, release);
		}
	}
};
