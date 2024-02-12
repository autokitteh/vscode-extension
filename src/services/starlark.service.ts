import * as fs from "fs";
import { connect } from "net";
import * as os from "os";
import * as path from "path";
import { namespaces, vsCommands, starlarkLSPUriScheme, starlarkExecutableGithubRepository } from "@constants";
import { starlarkLSPExtractedDirectory } from "@constants/starlark.constants";
import { StarlarkClientModes } from "@enums";
import { translate } from "@i18n";
import { Asset, AssetInfo, GitHubRelease } from "@interfaces";
import { LoggerService } from "@services";
import { StarlarkFileHandler } from "@starlark";
import { ValidateURL, extractArchive, getConfig, listFilesInDirectory, setConfig } from "@utilities";
import axios from "axios";
import { workspace, commands, window } from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions, StreamInfo } from "vscode-languageclient";

export class StarlarkLSPService {
	private static languageClient: LanguageClient | undefined = undefined;
	private static serverOptions: ServerOptions | StreamInfo;
	private static isInitErrorDisplayed: boolean = false;

	private static networkLSPRetryTimer: NodeJS.Timeout;
	private static starlarkLSPArgs: string[];
	private static starlarkLSPVersion: string;
	private static extensionPath: string;
	private static updateWorkspaceContext: (key: string, value: any) => Thenable<void>;

	public static async initiateLSPServer(
		starlarkPath: string,
		starlarkLSPArgs: string[],
		starlarkLSPVersion: string,
		extensionPath: string,
		updateWorkspaceContext: (key: string, value: any) => Thenable<void>
	) {
		clearTimeout(this.networkLSPRetryTimer);
		this.starlarkLSPArgs = starlarkLSPArgs;
		this.starlarkLSPVersion = starlarkLSPVersion;
		this.extensionPath = extensionPath;
		this.updateWorkspaceContext = updateWorkspaceContext;

		if (StarlarkLSPService.languageClient) {
			StarlarkLSPService.languageClient.stop();
		}

		let clientOptions: LanguageClientOptions = {
			documentSelector: [{ scheme: "file", language: "starlark" }],
			initializationOptions: {},
			outputChannelName: "autokitteh: Starlark LSP Server",
		};

		try {
			this.lspServerPathSettingsListener();

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
		} catch (error) {
			LoggerService.error(namespaces.startlarkLSPServer, (error as Error).message);
			commands.executeCommand(vsCommands.showErrorMessage, (error as Error).message);
		}
	}

	private static async initNetworkLSP(
		starlarkPath: string,
		starlarkLSPArgs: string[],
		clientOptions: LanguageClientOptions
	): Promise<void> {
		let serverMode = new URL(starlarkPath);

		const port = serverMode.port && Number(serverMode.port);
		const host = serverMode.hostname;
		if (!port) {
			throw new Error(translate().t("errors.missingStarlarkLSPPort"));
		}
		const socket = connect({ host, port });
		let streamListener: StreamInfo = { writer: socket, reader: socket };

		if (!this.serverOptions) {
			this.serverOptions = () => new Promise((resolve) => resolve(streamListener)) as Promise<StreamInfo>;
		}
		this.startLSPServer(this.serverOptions as ServerOptions, clientOptions, starlarkPath, starlarkLSPArgs, "socket");
	}

	private static async initLocalLSP(
		starlarkPath: string,
		starlarkLSPArgs: string[],
		clientOptions: LanguageClientOptions,
		starlarkLSPVersion: string,
		extensionPath: string,
		updateWorkspaceContext: (key: string, value: any) => Thenable<void>
	) {
		clearTimeout(this.networkLSPRetryTimer);

		let executableLSP;
		executableLSP = await this.checkAndUpdateStarlarkLSPVersion(starlarkPath, starlarkLSPVersion, extensionPath);

		const { path: newStarlarkPath, version: newStarlarkVersion } = executableLSP!;

		if (newStarlarkVersion !== starlarkLSPVersion) {
			setConfig("autokitteh.starlarkLSP", newStarlarkPath);
			updateWorkspaceContext("autokitteh.starlarkLSP", newStarlarkPath);
			LoggerService.info(namespaces.startlarkLSPServer, translate().t("lsp.executableDownloadedSuccessfully"));
			commands.executeCommand(
				vsCommands.showInfoMessage,
				translate().t("lsp.executableDownloadedSuccessfully", { version: newStarlarkVersion })
			);
		}

		let serverOptions = {
			command: newStarlarkPath,
			args: starlarkLSPArgs,
		};

		this.startLSPServer(serverOptions, clientOptions, newStarlarkPath, starlarkLSPArgs, newStarlarkVersion);
	}

	private static lspServerPathSettingsListener() {
		workspace.onDidChangeConfiguration((event) => {
			if (event.affectsConfiguration("autokitteh.starlarkLSP")) {
				const newStarlarkPath = getConfig("starlarkLSP", "");

				this.initiateLSPServer(
					newStarlarkPath,
					this.starlarkLSPArgs,
					this.starlarkLSPVersion,
					this.extensionPath,
					this.updateWorkspaceContext
				);
			}
		});
	}

	private static startLSPServer(
		serverOptions: ServerOptions,
		clientOptions: LanguageClientOptions,
		starlarkPath: string,
		starlarkLSPArgs: string[],
		version: string
	) {
		const localStarlarkFileExist = fs.existsSync(starlarkPath);

		if (localStarlarkFileExist || ValidateURL(starlarkPath)) {
			LoggerService.info(
				namespaces.startlarkLSPServer,
				`Starting LSP Server (${version}): ${starlarkPath} ${starlarkLSPArgs.join(", ")}`
			);

			StarlarkLSPService.languageClient = new LanguageClient(
				"Starlark",
				"autokitteh: Starlark LSP",
				serverOptions,
				clientOptions
			);

			StarlarkLSPService.languageClient.onDidChangeState((e) => {
				if (!this.isInitErrorDisplayed && !ValidateURL(starlarkPath)) {
					this.isInitErrorDisplayed = true;
					return;
				}
				if (Number(e.newState) === StarlarkClientModes.error) {
					StarlarkLSPService.languageClient!.stop();
					if (ValidateURL(starlarkPath)) {
						LoggerService.error(namespaces.startlarkLSPServer, translate().t("starlark.initFailed"));
						this.networkLSPRetryTimer = setTimeout(() => {
							if (ValidateURL(starlarkPath)) {
								this.initNetworkLSP(starlarkPath, starlarkLSPArgs, clientOptions);
							} else {
							}
						}, 5000);
					}
				}
			});

			StarlarkLSPService.languageClient.start();

			StarlarkLSPService.languageClient.onReady().then(() => {
				LoggerService.info(namespaces.startlarkLSPServer, translate().t("starlark.initSuccess"));
			});

			workspace.registerTextDocumentContentProvider(
				starlarkLSPUriScheme,
				new StarlarkFileHandler(StarlarkLSPService.languageClient)
			);
		}
	}

	private static getAssetByPlatform = (data: GitHubRelease, platform: string, arch: string): AssetInfo => {
		const enrichedPlatform = `autokitteh-starlark-lsp_${platform}_${arch}`;
		const latestRelease = data.data[0];
		const asset: Asset | undefined = latestRelease.assets.find((asset: Asset) => asset.name.includes(enrichedPlatform));

		if (!asset) {
			throw new Error(translate().t("errors.starlarkPlatformNotSupported"));
		}

		return {
			url: asset.browser_download_url,
			tag: latestRelease.tag_name,
		};
	};

	private static async getLatestRelease(platform: string, arch: string): Promise<AssetInfo> {
		const response = await axios.get(starlarkExecutableGithubRepository);
		return this.getAssetByPlatform(response, platform, arch);
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

	private static getCommonArchName(): string {
		const nodeArch = os.arch();
		const archMapping: Record<string, string> = {
			x64: "x86_64",
			arm64: "x86_64",
		};

		return archMapping[nodeArch] || nodeArch;
	}

	private static async checkAndUpdateStarlarkLSPVersion(
		starlarkPath: string,
		starlarkLSPVersion: string,
		extensionPath: string
	): Promise<{ path: string; version: string } | undefined> {
		const platform = os.platform();
		const arch = this.getCommonArchName();

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

		LoggerService.info(
			namespaces.startlarkLSPServer,
			translate().t("lsp.downloadExecutableInProgress", { version: release.tag })
		);

		const fileName = this.getFileNameFromUrl(release.url);

		const resultStarlarkPath = await this.downloadNewVersion(release, extensionPath, fileName);
		return { path: resultStarlarkPath, version: release.tag };
	}
}
