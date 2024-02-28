import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { namespaces, starlarkExecutableGithubRepository, starlarkLSPExtractedDirectory } from "@constants";
import { translate } from "@i18n";
import { AssetInfo, GitHubRelease } from "@interfaces";
import { LoggerService } from "@services";
import { extractArchive, listFilesInDirectory } from "@utilities";
import axios from "axios";
import { window } from "vscode";

export class StarlarkVersionManagerService {
	public static async updateLSPVersionIfNeeded(
		currentPath: string,
		currentVersion: string,
		extensionPath: string
	): Promise<{ path?: string; version?: string; error?: Error; didUpdate: boolean }> {
		const platform = os.platform();
		const arch = StarlarkVersionManagerService.determineArchitecture();

		const { data: latestRelease, error: releaseError } = await StarlarkVersionManagerService.fetchLatestReleaseInfo(
			platform,
			arch
		);
		if (releaseError) {
			return {
				error: new Error(translate().t("starlark.executableDownloadedFailedError", { error: releaseError.message })),
				didUpdate: false,
			};
		}

		const doesFileExist = fs.existsSync(currentPath);
		if (currentVersion === latestRelease!.tag && doesFileExist) {
			return { didUpdate: false };
		}

		const userResponse = await StarlarkVersionManagerService.promptUserForUpdate(doesFileExist);
		if (userResponse !== translate().t("starlark.downloadExecutableDialogApprove")) {
			return { didUpdate: false };
		}

		const { data: newFilePath, error: newFileError } = await StarlarkVersionManagerService.downloadAndUpdateLSP(
			latestRelease!,
			extensionPath
		);
		if (newFileError) {
			const error = new Error(
				translate().t("starlark.executableDownloadedFailedError", { error: newFileError.message })
			);
			return { error, didUpdate: false };
		}

		return {
			path: newFilePath!,
			version: latestRelease!.tag,
			didUpdate: true,
		};
	}

	private static async fetchLatestReleaseInfo(
		platform: string,
		arch: string
	): Promise<{
		data?: AssetInfo;
		error?: Error;
	}> {
		try {
			const response = await axios.get(starlarkExecutableGithubRepository);
			const { data: assetInfo } = StarlarkVersionManagerService.extractAssetInfo(response.data, platform, arch);
			return { data: assetInfo };
		} catch (error) {
			return { error: error as Error };
		}
	}

	private static extractAssetInfo(
		data: GitHubRelease[],
		platform: string,
		arch: string
	): {
		data?: AssetInfo;
		error?: Error;
	} {
		const platformIdentifier = `autokitteh-starlark-lsp_${platform}_${arch}`;
		const latestRelease = data[0];
		const matchingAsset = latestRelease.assets.find((asset) => asset.name.includes(platformIdentifier));

		if (!matchingAsset) {
			return {
				error: new Error(translate().t("errors.starlarkPlatformNotSupported")),
			};
		}

		return {
			data: {
				url: matchingAsset.browser_download_url,
				tag: latestRelease.tag_name,
			},
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
		data?: string;
		error?: Error;
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
			};
		}
		LoggerService.info(namespaces.startlarkLSPServer, translate().t("starlark.executableUnpackedSuccessfully"));

		return {
			data: extractedFiles[0],
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

	private static determineArchitecture(): string {
		const archMappings: Record<string, string> = { x64: "x86_64", arm64: "x86_64" };
		return archMappings[os.arch()] || os.arch();
	}
}
