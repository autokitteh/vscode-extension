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

export class VersionManagerService {
	public async updateLSPVersionIfNeeded(
		currentPath: string,
		currentVersion: string,
		extensionPath: string
	): Promise<{ path: string; version: string } | undefined> {
		const platform = os.platform();
		const arch = this.determineArchitecture();

		const latestRelease = await this.fetchLatestReleaseInfo(platform, arch);
		if (latestRelease instanceof Error) {
			LoggerService.info(
				namespaces.startlarkLSPServer,
				translate().t("lsp.executableDownloadedFailedError", { error: latestRelease.message })
			);
			commands.executeCommand(vsCommands.showErrorMessage, translate().t("lsp.executableDownloadedFailed"));
			return;
		}

		const doesFileExist = fs.existsSync(currentPath);
		if (currentVersion === latestRelease.tag && doesFileExist) {
			return { path: currentPath, version: currentVersion };
		}

		const userResponse = await this.promptUserForUpdate(doesFileExist);
		if (userResponse !== translate().t("lsp.downloadExecutableDialogApprove")) {
			return { path: currentPath, version: currentVersion };
		}

		const newFilePath = await this.downloadAndUpdateLSP(latestRelease, extensionPath);
		return { path: newFilePath, version: latestRelease.tag };
	}

	private async fetchLatestReleaseInfo(platform: string, arch: string): Promise<AssetInfo | Error> {
		try {
			const response = await axios.get(starlarkExecutableGithubRepository);
			return this.extractAssetInfo(response.data, platform, arch);
		} catch (error) {
			return new Error((error as Error).message);
		}
	}

	private extractAssetInfo(data: GitHubRelease[], platform: string, arch: string): AssetInfo {
		const platformIdentifier = `autokitteh-starlark-lsp_${platform}_${arch}`;
		const latestRelease = data[0];
		const matchingAsset = latestRelease.assets.find((asset) => asset.name.includes(platformIdentifier));

		if (!matchingAsset) {
			throw new Error(translate().t("errors.starlarkPlatformNotSupported"));
		}

		return {
			url: matchingAsset.browser_download_url,
			tag: latestRelease.tag_name,
		};
	}

	private async promptUserForUpdate(doesFileExist: boolean): Promise<string | undefined> {
		const dialogType = doesFileExist ? "lsp.updateExecutableDialog" : "lsp.downloadExecutableDialog";
		return await window.showInformationMessage(
			translate().t(dialogType),
			translate().t("lsp.downloadExecutableDialogApprove"),
			translate().t("lsp.downloadExecutableDialogDismiss")
		);
	}

	private async downloadAndUpdateLSP(release: AssetInfo, extensionPath: string): Promise<string> {
		const fileName = path.basename(new URL(release.url).pathname);
		const filePath = path.join(extensionPath, fileName);
		await this.downloadFile(release.url, filePath);

		LoggerService.info(namespaces.startlarkLSPServer, translate().t("lsp.executableDownloadedUnpacking"));
		await extractArchive(filePath, extensionPath);

		const extractedFiles = await listFilesInDirectory(path.join(extensionPath, starlarkLSPExtractedDirectory));
		if (extractedFiles.length !== 1) {
			throw new Error(translate().t("errors.corruptedLSPArchive"));
		}

		return extractedFiles[0];
	}

	private async downloadFile(url: string, filePath: string): Promise<void> {
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

	private determineArchitecture(): string {
		const archMappings: Record<string, string> = { x64: "x86_64", arm64: "x86_64" };
		return archMappings[os.arch()] || os.arch();
	}
}
