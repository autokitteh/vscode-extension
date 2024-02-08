import * as fs from "fs";
import { connect } from "net";
import * as os from "os";
import * as path from "path";
import { namespaces, vsCommands, starlarkLSPUriScheme, starlarkExecutableGithubRepository } from "@constants";
import { starlarkLSPExtractedDirectory } from "@constants/starlark.constants";
import { translate } from "@i18n";
import { Asset, AssetInfo, GitHubRelease } from "@interfaces";
import { LoggerService } from "@services";
import { StarlarkFileHandler } from "@starlark";
import { ValidateURL, extractArchive, listFilesInDirectory, setConfig } from "@utilities";
import axios from "axios";
import { workspace, commands, window } from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions, StreamInfo } from "vscode-languageclient";

export class StarlarkLSPService {
	private static languageClient: LanguageClient | undefined = undefined;

	public static async initiateLSPServer(
		starlarkPath: string,
		starlarkLSPArgs: string[],
		starlarkLSPVersion: string,
		extensionPath: string,
		updateWorkspaceContext: (key: string, value: any) => Thenable<void>
	) {
		if (StarlarkLSPService.languageClient) {
			StarlarkLSPService.languageClient.stop();
		}

		let clientOptions: LanguageClientOptions = {
			documentSelector: [{ scheme: "file", language: "starlark" }],
			initializationOptions: {},
			outputChannelName: "autokitteh: Starlark LSP Server",
		};

		/* By default, the Starlark LSP operates through a CMD command in stdio mode.
		 * However, if the 'starlarkLSPSocketMode' is enabled, the LSP won't initiate automatically.
		 * Instead, VSCode connects to 'localhost:starlarkLSPPort', expecting the Starlark LSP to be running in socket mode. */
		if (ValidateURL(starlarkPath)) {
			this.initNetworkLSP(starlarkPath, starlarkLSPArgs, clientOptions);
			return;
		}
		this.initLocalLSP(
			starlarkPath,
			starlarkLSPArgs,
			clientOptions,
			starlarkLSPVersion,
			extensionPath,
			updateWorkspaceContext
		);
	}

	private static async initLocalLSP(
		starlarkPath: string,
		starlarkLSPArgs: string[],
		clientOptions: LanguageClientOptions,
		starlarkLSPVersion: string,
		extensionPath: string,
		updateWorkspaceContext: (key: string, value: any) => Thenable<void>
	) {
		let executableLSP;
		try {
			executableLSP = await this.checkAndUpdateStarlarkLSPVersion(starlarkPath, starlarkLSPVersion, extensionPath);
		} catch (error) {
			LoggerService.error(namespaces.startlarkLSPServer, (error as Error).message);
			commands.executeCommand(vsCommands.showErrorMessage, (error as Error).message);
			return;
		}

		const { path: newStarlarkPath, version: newStarlarkVersion } = executableLSP!;

		if (newStarlarkVersion !== starlarkLSPVersion) {
			try {
				setConfig("autokitteh.LSPPath", newStarlarkPath);
				updateWorkspaceContext("autokitteh.starlarkLSPVersion", newStarlarkVersion);
				LoggerService.info(namespaces.starlarkLSPExecutable, translate().t("lsp.executableDownloadedSuccessfully"));
				commands.executeCommand(vsCommands.showInfoMessage, translate().t("lsp.executableDownloadedSuccessfully"));
			} catch (error) {
				LoggerService.error(namespaces.startlarkLSPServer, (error as Error).message);
				commands.executeCommand(vsCommands.showErrorMessage, (error as Error).message);
			}
		}

		let serverOptions = {
			command: newStarlarkPath,
			args: starlarkLSPArgs,
		};

		this.startLSPServer(serverOptions, clientOptions, starlarkPath, starlarkLSPArgs);
	}

	private static startLSPServer(
		serverOptions: ServerOptions,
		clientOptions: LanguageClientOptions,
		starlarkPath: string,
		starlarkLSPArgs: string[]
	) {
		LoggerService.info(
			namespaces.startlarkLSPServer,
			`Starting LSP Server: ${starlarkPath} ${starlarkLSPArgs.join(", ")}`
		);

		StarlarkLSPService.languageClient = new LanguageClient(
			"Starlark",
			"autokitteh: Starlark LSP",
			serverOptions,
			clientOptions
		);

		try {
			StarlarkLSPService.languageClient.start();

			workspace.registerTextDocumentContentProvider(
				starlarkLSPUriScheme,
				new StarlarkFileHandler(StarlarkLSPService.languageClient)
			);
		} catch (error) {
			LoggerService.error(namespaces.startlarkLSPServer, (error as Error).message);
		}
	}

	private static getAssetByPlatform = (data: GitHubRelease, platform: string, arch: string): AssetInfo => {
		const enrichedPlatform = `autokitteh-starlark-lsp_${platform}_${arch}`;
		const latestRelease = data.data[data.data.length - 1];
		const asset: Asset | undefined = latestRelease.assets.find((asset: Asset) => asset.name.includes(enrichedPlatform));

		if (!asset) {
			throw new Error(translate().t("errors.starlarkPlatformNotSupported"));
		}

		return {
			url: asset.browser_download_url,
			tag: latestRelease.tag_name,
		};
	};

	private static async initNetworkLSP(
		starlarkPath: string,
		starlarkLSPArgs: string[],
		clientOptions: LanguageClientOptions
	): Promise<void> {
		let serverMode = new URL(starlarkPath);

		const port = serverMode.port && Number(serverMode.port);
		const host = serverMode.hostname;
		if (!port) {
			LoggerService.error(namespaces.startlarkLSPServer, translate().t("errors.missingStarlarkLSPPort"));
			commands.executeCommand(
				vsCommands.showErrorMessage,
				namespaces.startlarkLSPServer,
				translate().t("errors.missingStarlarkLSPPort")
			);

			return;
		}
		const socket = connect({ host, port });
		let streamListener: StreamInfo = { writer: socket, reader: socket };

		let serverOptions = () => new Promise((resolve) => resolve(streamListener)) as Promise<StreamInfo>;
		this.startLSPServer(serverOptions, clientOptions, starlarkPath, starlarkLSPArgs);
	}

	private static async getLatestRelease(platform: string, arch: string): Promise<AssetInfo> {
		try {
			const response = await axios.get(starlarkExecutableGithubRepository);
			return this.getAssetByPlatform(response, platform, arch);
		} catch (error) {
			const errorMessage = translate().t("errors.fetchingReleaseInfo", { error: (error as Error).message });
			throw new Error(errorMessage);
		}
	}

	private static getFileNameFromUrl(downloadUrl: string): string {
		return path.basename(new URL(downloadUrl).pathname);
	}

	private static async downloadFile(url: string, filePath: string): Promise<void> {
		const response = await axios.get(url, { responseType: "stream" });
		const writer = fs.createWriteStream(filePath);
		response.data.pipe(writer);
		await new Promise((resolve, reject) => {
			writer.on("close", resolve);
			writer.on("error", (err) => {
				writer.close();
				reject(err);
			});
		});
		return;
	}

	private static async downloadNewVersion(
		release: AssetInfo,
		extensionPath: string,
		fileName: string
	): Promise<string> {
		try {
			await this.downloadFile(release.url, `${extensionPath}/${fileName}`);
		} catch (downloadError) {
			const errorMessage = translate().t("errors.fetchingReleaseInfo", {
				error: (downloadError as Error).message,
			});
			throw new Error(errorMessage);
		}

		try {
			LoggerService.info(namespaces.startlarkLSPServer, translate().t("lsp.executableDownloadedUnpacking"));

			await extractArchive(`${extensionPath}/${fileName}`, extensionPath);
		} catch (extractError) {
			const errorMessage = translate().t("errors.issueExtractLSP", { error: (extractError as Error).message });
			throw new Error(errorMessage);
		}

		const filesInLSPDirectory = await listFilesInDirectory(`${extensionPath}/${starlarkLSPExtractedDirectory}`);

		if (filesInLSPDirectory.length !== 1) {
			const errorMessage = translate().t("errors.errors.corruptedLSPArchive");
			throw new Error(errorMessage);
		}

		return filesInLSPDirectory[0];
	}

	private static async checkAndUpdateStarlarkLSPVersion(
		starlarkPath: string,
		starlarkLSPVersion: string,
		extensionPath: string
	): Promise<{ path: string; version?: string } | undefined> {
		const platform = os.platform();
		const arch = os.arch();

		const release = await this.getLatestRelease(platform, arch);

		let userResponse: string | undefined;
		const localStarlarkFileExist = fs.existsSync(starlarkPath);

		if (starlarkLSPVersion === release.tag && localStarlarkFileExist) {
			return { path: starlarkPath, version: starlarkLSPVersion };
		}

		if (!localStarlarkFileExist) {
			userResponse = await window.showInformationMessage(
				translate().t("lsp.downloadExecutableDialog"),
				translate().t("lsp.downloadExecutableDialogApprove"),
				translate().t("lsp.downloadExecutableDialogDismiss")
			);
		} else {
			userResponse = await window.showInformationMessage(
				translate().t("lsp.updateExecutableDialog"),
				translate().t("lsp.downloadExecutableDialogApprove"),
				translate().t("lsp.downloadExecutableDialogDismiss")
			);
		}
		if (userResponse !== translate().t("lsp.downloadExecutableDialogApprove")) {
			return { path: starlarkPath, version: starlarkLSPVersion };
		}

		LoggerService.info(namespaces.startlarkLSPServer, translate().t("lsp.downloadExecutableInProgress"));

		const fileName = this.getFileNameFromUrl(release.url);

		const resultStarlarkPath = await this.downloadNewVersion(release, extensionPath, fileName);

		LoggerService.info(namespaces.startlarkLSPServer, translate().t("lsp.executableDownloadedSuccessfully"));

		return { path: resultStarlarkPath, version: release.tag };
	}
}
