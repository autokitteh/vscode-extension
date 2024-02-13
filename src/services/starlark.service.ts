import * as fs from "fs";
import { namespaces, vsCommands, starlarkLSPUriScheme } from "@constants";
import { translate } from "@i18n";
import { LoggerService } from "@services";
import { NetworkClient } from "@services/starlark/starlarkNetworkClient.service";
import { VersionManager } from "@services/starlark/starlarkVersionManager.service";
import { StarlarkFileHandler } from "@starlark";
import { ValidateURL, getConfig, setConfig } from "@utilities";
import { workspace, commands } from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions } from "vscode-languageclient";

export class StarlarkLSPService {
	private static languageClient: LanguageClient | undefined = undefined;

	private static connecting: boolean = false;
	private static isListenerActivated: boolean = false;
	private static lspNetwork = new NetworkClient();
	private static versionManager = new VersionManager();

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

				const serverOptions = () => this.lspNetwork.startServer(host, port);
				this.startLSPServer(serverOptions as ServerOptions, clientOptions, starlarkPath, starlarkLSPArgs, "socket");
				return;
			}

			this.lspNetwork.closeConnection();
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

	private static async initLocalLSP(
		starlarkPath: string,
		starlarkLSPArgs: string[],
		clientOptions: LanguageClientOptions,
		starlarkLSPVersion: string,
		extensionPath: string,
		updateWorkspaceContext: (key: string, value: any) => Thenable<void>
	) {
		let executableLSP;
		executableLSP = await this.versionManager.updateLSPVersionIfNeeded(starlarkPath, starlarkLSPVersion, extensionPath);
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
}
