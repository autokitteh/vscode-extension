import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { namespaces, starlarkExecutableGithubRepository, starlarkLSPExtractedDirectory, vsCommands } from "@constants";
import { translate } from "@i18n";
import { AssetInfo, GitHubRelease } from "@interfaces";
import { LoggerService } from "@services";
import { extractArchive, listFilesInDirectory } from "@utilities";
import axios from "axios";
import { commands, window } from "vscode";

export class StarlarkVersionManagerService {
	public static async updateLSPVersionIfNeeded(
		currentPath: string,
		currentVersion: string,
		extensionPath: string
	): Promise<{ path: string | undefined; version: string | undefined; error: Error | undefined }> {
		const platform = os.platform();
		const { data: arch, error: archError } = StarlarkVersionManagerService.determineArchitecture();
		if (archError) {
			LoggerService.info(namespaces.startlarkLSPServer, archError.message);
			commands.executeCommand(vsCommands.showErrorMessage, translate().t("starlark.executableArchitetureNotFound"));
			return { path: currentPath, version: currentVersion, error: undefined };
		}

		const { data: latestRelease, error: releaseError } = await StarlarkVersionManagerService.fetchLatestReleaseInfo(
			platform,
			arch!
		);
		if (releaseError) {
			return {
				path: currentPath,
				version: currentVersion,
				error: new Error(translate().t("starlark.executableDownloadedFailedError", { error: releaseError.message })),
			};
		}

		const doesFileExist = fs.existsSync(currentPath);
		if (currentVersion === latestRelease!.tag && doesFileExist) {
			return { path: currentPath, version: currentVersion, error: undefined };
		}

		const userResponse = await StarlarkVersionManagerService.promptUserForUpdate(doesFileExist);
		if (userResponse !== translate().t("starlark.downloadExecutableDialogApprove")) {
			return {
				path: currentPath,
				version: currentVersion,
				error: new Error(translate().t("starlark.executableDownloadedDismissed")),
			};
		}

		const { data: newFilePath, error: newFileError } = await StarlarkVersionManagerService.downloadAndUpdateLSP(
			latestRelease!,
			extensionPath
		);
		if (newFileError) {
			return {
				path: undefined,
				version: undefined,
				error: new Error(translate().t("starlark.executableDownloadedFailedError", { error: newFileError.message })),
			};
		}

		return { path: newFilePath!, version: latestRelease!.tag, error: undefined };
	}

	private static async fetchLatestReleaseInfo(
		platform: string,
		arch: string
	): Promise<{
		data: AssetInfo | undefined;
		error: Error | undefined;
	}> {
		try {
			const response = await axios.get(starlarkExecutableGithubRepository);
			const { data: assetInfo } = StarlarkVersionManagerService.extractAssetInfo(response.data, platform, arch);
			return { data: assetInfo, error: undefined };
		} catch (error) {
			return { error: error as Error, data: undefined };
		}
	}

	private static extractAssetInfo(
		data: GitHubRelease[],
		platform: string,
		arch: string
	): {
		data: AssetInfo | undefined;
		error: Error | undefined;
	} {
		const platformIdentifier = `autokitteh-starlark-lsp_${platform}_${arch}`;
		const latestRelease = data[0];
		const matchingAsset = latestRelease.assets.find((asset) => asset.name.includes(platformIdentifier));

		if (!matchingAsset) {
			return {
				data: undefined,
				error: new Error(translate().t("errors.starlarkPlatformNotSupported")),
			};
		}

		return {
			data: {
				url: matchingAsset.browser_download_url,
				tag: latestRelease.tag_name,
			},
			error: undefined,
		};
	}

	private static async promptUserForUpdate(doesFileExist: boolean): Promise<string | undefined> {
		const dialogType = doesFileExist ? "starlark.updateExecutableDialog" : "starlark.downloadExecutableDialog";
		return await window.showInformationMessage(
			translate().t(dialogType),
			translate().t("starlark.downloadExecutableDialogApprove"),
			translate().t("starlark.downloadExecutableDialogDismiss")
		);
	}

	private static async downloadAndUpdateLSP(
		release: AssetInfo,
		extensionPath: string
	): Promise<{
		data: string | undefined;
		error: Error | undefined;
	}> {
		const fileName = path.basename(new URL(release.url).pathname);
		const filePath = path.join(extensionPath, fileName);
		LoggerService.info(namespaces.startlarkLSPServer, translate().t("starlark.executableDownloading"));

		await StarlarkVersionManagerService.downloadFile(release.url, filePath);
		LoggerService.info(namespaces.startlarkLSPServer, translate().t("starlark.executableDownloadedUnpacking"));

		await extractArchive(filePath, extensionPath);

		const extractedFiles = await listFilesInDirectory(path.join(extensionPath, starlarkLSPExtractedDirectory));
		if (extractedFiles.length !== 1) {
			return {
				error: new Error(translate().t("errors.corruptedLSPArchive")),
				data: undefined,
			};
		}
		LoggerService.info(namespaces.startlarkLSPServer, translate().t("starlark.executableUnpackedSuccessfully"));

		return {
			data: extractedFiles[0],
			error: undefined,
		};
	}

	private static async downloadFile(url: string, filePath: string): Promise<void> {
		const response = await axios.get(url, { responseType: "stream" });
		const writer = fs.createWriteStream(filePath);
		response.data.pipe(writer);

		return new Promise((resolve, reject) => {
			writer.on("finish", resolve);
			writer.on("error", (error) => {
				writer.close();
				reject(error);
			});
		});
	}

	private static determineArchitecture(): { data: string | undefined; error: Error | undefined } {
		const archMappings: Record<string, string> = { x64: "x86_64", arm64: "x86_64" };
		return {
			data: archMappings[os.arch()] || os.arch(),
			error: undefined,
		};
	}
}