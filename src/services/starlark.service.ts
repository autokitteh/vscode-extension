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
import { ValidateURL, extractArchive, getConfig, listFilesInDirectory, setConfig } from "@utilities";
import axios, { AxiosError } from "axios";
import { workspace, commands, window } from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions, StreamInfo } from "vscode-languageclient";

export class StarlarkLSPService {
	private static languageClient: LanguageClient | undefined = undefined;

	private static connecting: boolean = false;
	private static isListenerActivated: boolean = false;
	private static retryTimer: NodeJS.Timeout | undefined;
	private static localLSPConnected: boolean = false;

	public static async initiateLSPServer(
		starlarkPath: string,
		starlarkLSPArgs: string[],
		starlarkLSPVersion: string,
		extensionPath: string,
		updateWorkspaceContext: (key: string, value: any) => Thenable<void>,
		getWorkspaceContext: <T>(key: string, defaultValue: T) => T
	) {
		if (StarlarkLSPService.languageClient) {
			StarlarkLSPService.languageClient.stop();
		}

		let clientOptions: LanguageClientOptions = {
			documentSelector: [{ scheme: "file", language: "starlark" }],
			initializationOptions: {},
			outputChannelName: "autokitteh: Starlark LSP Server",
		};

		try {
			if (!this.isListenerActivated) {
				this.lspServerPathSettingsListener(
					starlarkLSPArgs,
					starlarkLSPVersion,
					extensionPath,
					updateWorkspaceContext,
					getWorkspaceContext
				);
			}

			/* By default, the Starlark LSP operates through a CMD command in stdio mode.
			 * However, if the 'starlarkLSPSocketMode' is enabled, the LSP won't initiate automatically.
			 * Instead, VSCode connects to 'localhost:starlarkLSPPort', expecting the Starlark LSP to be running in socket mode. */
			if (ValidateURL(starlarkPath)) {
				let serverMode = new URL(starlarkPath);

				const port = (serverMode.port && Number(serverMode.port)) as number;
				const host = serverMode.hostname;
				if (!port || !host || this.connecting) {
					return;
				}
				this.startLanguageServerViaNetwork(host, port, clientOptions, starlarkPath, starlarkLSPArgs);
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

	private static async startLanguageServerViaNetwork(
		host: string,
		port: number,
		clientOptions: LanguageClientOptions,
		starlarkPath: string,
		starlarkLSPArgs: string[]
	): Promise<void> {
		const serverOptions = () =>
			new Promise<StreamInfo>((resolve) => {
				const connectToServer = () => {
					if (StarlarkLSPService.connecting || StarlarkLSPService.localLSPConnected) {
						return;
					}
					StarlarkLSPService.connecting = true;

					const socket = connect({ port, host }, () => {
						LoggerService.info(namespaces.startlarkLSPServer, "Connected to LSP server");
						StarlarkLSPService.connecting = false;
						resolve({
							reader: socket,
							writer: socket,
						});
					});

					socket.on("error", (error) => {
						LoggerService.error(namespaces.startlarkLSPServer, "Connection error:" + error);
						StarlarkLSPService.connecting = false;
						if (!StarlarkLSPService.localLSPConnected) {
							clearTimeout(this.retryTimer);
							this.retryTimer = setTimeout(connectToServer, 1000);
						}
					});

					socket.on("end", () => {
						LoggerService.info(namespaces.startlarkLSPServer, "Disconnected from LSP server");
						StarlarkLSPService.connecting = false;
						if (!StarlarkLSPService.localLSPConnected) {
							clearTimeout(this.retryTimer);
							this.retryTimer = setTimeout(connectToServer, 1000);
						}
					});

					socket.on("close", () => {
						LoggerService.info(namespaces.startlarkLSPServer, "Connection closed");
						StarlarkLSPService.connecting = false;
						if (!StarlarkLSPService.localLSPConnected) {
							clearTimeout(this.retryTimer);
							this.retryTimer = setTimeout(connectToServer, 1000);
						}
					});
				};
				connectToServer();
			});
		this.startLSPServer(serverOptions as ServerOptions, clientOptions, starlarkPath, starlarkLSPArgs, "socket");
	}

	private static async initLocalLSP(
		starlarkPath: string,
		starlarkLSPArgs: string[],
		clientOptions: LanguageClientOptions,
		starlarkLSPVersion: string,
		extensionPath: string,
		updateWorkspaceContext: (key: string, value: any) => Thenable<void>
	) {
		clearTimeout(this.retryTimer);

		let executableLSP;
		executableLSP = await this.checkAndUpdateStarlarkLSPVersion(starlarkPath, starlarkLSPVersion, extensionPath);
		if (!executableLSP) {
			return;
		}

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

	private static lspServerPathSettingsListener(
		starlarkLSPArgs: string[],
		starlarkLSPVersion: string,
		extensionPath: string,
		updateWorkspaceContext: (key: string, value: any) => Thenable<void>,
		getWorkspaceContext: <T>(key: string, defaultValue: T) => T
	) {
		workspace.onDidChangeConfiguration((event) => {
			if (event.affectsConfiguration("autokitteh.starlarkLSP")) {
				clearTimeout(this.retryTimer);
				StarlarkLSPService.languageClient?.stop();

				const newStarlarkPath =
					getConfig("starlarkLSP", "") || getWorkspaceContext<string>("autokitteh.starlarkLSP", "");
				this.connecting = false;
				this.initiateLSPServer(
					newStarlarkPath,
					starlarkLSPArgs,
					starlarkLSPVersion,
					extensionPath,
					updateWorkspaceContext,
					getWorkspaceContext
				);
			}
		});
		this.isListenerActivated = true;
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

			StarlarkLSPService.languageClient.start();

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

	private static async getLatestRelease(platform: string, arch: string): Promise<AssetInfo | unknown> {
		try {
			const response = await axios.get(starlarkExecutableGithubRepository);
			return this.getAssetByPlatform(response, platform, arch);
		} catch (error) {
			return new Error((error as AxiosError).message);
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

		if ((release as Error).message) {
			LoggerService.info(
				namespaces.startlarkLSPServer,
				translate().t("lsp.executableDownloadedFailedError", { error: (release as Error).message })
			);
			commands.executeCommand(vsCommands.showErrorMessage, translate().t("lsp.executableDownloadedFailed"));
			return;
		}

		const latestRelease = release as AssetInfo;
		let userResponse: string | undefined;
		const localStarlarkFileExist = fs.existsSync(starlarkPath);

		if (starlarkLSPVersion === latestRelease.tag && localStarlarkFileExist) {
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
			translate().t("lsp.downloadExecutableInProgress", { version: latestRelease.tag })
		);

		const fileName = this.getFileNameFromUrl(latestRelease.url);

		const resultStarlarkPath = await this.downloadNewVersion(latestRelease, extensionPath, fileName);
		return { path: resultStarlarkPath, version: latestRelease.tag };
	}
}
