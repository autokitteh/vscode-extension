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
import axios from "axios";
import { workspace, commands, window } from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions, StreamInfo } from "vscode-languageclient";

export class StarlarkLSPService {
	private static languageClient: LanguageClient | undefined = undefined;

	private static starlarkLSPArgs: string[];
	private static starlarkLSPVersion: string;
	private static extensionPath: string;
	private static updateWorkspaceContext: (key: string, value: any) => Thenable<void>;
	private static connecting: boolean = false;

	public static async initiateLSPServer(
		starlarkPath: string,
		starlarkLSPArgs: string[],
		starlarkLSPVersion: string,
		extensionPath: string,
		updateWorkspaceContext: (key: string, value: any) => Thenable<void>
	) {
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
			/* By default, the Starlark LSP operates through a CMD command in stdio mode.
			 * However, if the 'starlarkLSPSocketMode' is enabled, the LSP won't initiate automatically.
			 * Instead, VSCode connects to 'localhost:starlarkLSPPort', expecting the Starlark LSP to be running in socket mode. */
			if (ValidateURL(starlarkPath)) {
				let serverMode = new URL(starlarkPath);

				const port = (serverMode.port && Number(serverMode.port)) as number;
				const host = serverMode.hostname;
				this.startLanguageServerViaNetwork(host, port, clientOptions, starlarkPath);
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
		starlarkPath: string
	): Promise<void> {
		const serverOptions = () =>
			new Promise<StreamInfo>((resolve) => {
				const connectToServer = () => {
					// Prevent multiple simultaneous connection attempts
					if (StarlarkLSPService.connecting) {
						return;
					}
					StarlarkLSPService.connecting = true;

					const socket = connect({ port, host }, () => {
						LoggerService.info(namespaces.startlarkLSPServer, "Connected to LSP server");
						StarlarkLSPService.connecting = false; // Reset the flag upon successful connection
						resolve({
							reader: socket,
							writer: socket,
						});
					});

					socket.on("error", (error) => {
						LoggerService.error(namespaces.startlarkLSPServer, "Connection error:" + error);
						StarlarkLSPService.connecting = false; // Reset the flag upon error
						setTimeout(connectToServer, 1000); // Retry connection after 1 second
					});

					socket.on("end", () => {
						LoggerService.info(namespaces.startlarkLSPServer, "Disconnected from LSP server");
						StarlarkLSPService.connecting = false; // Ensure the flag is reset upon disconnection
						setTimeout(connectToServer, 1000); // Reconnect automatically
					});

					// Optionally, handle the 'close' event to cover all disconnection scenarios
					socket.on("close", () => {
						LoggerService.info(namespaces.startlarkLSPServer, "Connection closed");
						StarlarkLSPService.connecting = false; // Reset the flag upon closing
						setTimeout(connectToServer, 1000); // Ensures reconnection logic is triggered
					});
				};
				connectToServer();
			});
		this.startLSPServer(serverOptions as ServerOptions, clientOptions, starlarkPath, this.starlarkLSPArgs, "socket");
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
