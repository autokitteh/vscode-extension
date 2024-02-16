import * as fs from "fs";
import { namespaces, vsCommands, starlarkLSPUriScheme, starlarkLocalLSPDefaultArgs } from "@constants";
import { translate } from "@i18n";
import { ExtensionContextService, NetworkClientService, VersionManagerService, LoggerService } from "@services";
import { StarlarkFileHandler } from "@starlark";
import { ValidateURL, WorkspaceConfig } from "@utilities";
import { workspace, commands } from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions } from "vscode-languageclient";

export class StarlarkLSPService {
	private languageClient: LanguageClient | undefined = undefined;
	private networkManager: NetworkClientService;
	private versionManager: VersionManagerService;
	private extensionContext: ExtensionContextService;

	private connecting: boolean = false;
	private isListenerActivated: boolean = false;

	public constructor(
		extensionContext: ExtensionContextService,
		networkManager: NetworkClientService,
		versionManager: VersionManagerService
	) {
		this.extensionContext = extensionContext;
		this.networkManager = networkManager;
		this.versionManager = versionManager;
	}

	public async initiateLSPServer(starlarkPath: string, isOnTypeChange: boolean = false) {
		if (this.languageClient) {
			this.languageClient.stop();
		}

		let clientOptions: LanguageClientOptions = {
			documentSelector: [{ scheme: "file", language: "starlark" }],
			initializationOptions: {},
			outputChannelName: "autokitteh: Starlark LSP Server",
		};

		try {
			if (!this.isListenerActivated) {
				this.lspServerPathSettingsListener();
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

				const serverOptions = () => this.networkManager.startServer(host, port);
				this.startLSPServer(serverOptions as ServerOptions, clientOptions, "socket", starlarkPath);
				return;
			}

			this.networkManager.closeConnection();
			this.initLocalLSP(clientOptions, isOnTypeChange);
		} catch (error) {
			LoggerService.error(namespaces.startlarkLSPServer, (error as Error).message);
			commands.executeCommand(vsCommands.showErrorMessage, (error as Error).message);
		}
	}

	private async initLocalLSP(clientOptions: LanguageClientOptions, isOnTypeChange: boolean) {
		let executableLSP;
		const { starlarkPath, starlarkLSPVersion, extensionPath } = this.extensionContext.getLSPConfigurations();

		executableLSP = await this.versionManager.updateLSPVersionIfNeeded(starlarkPath, starlarkLSPVersion, extensionPath);
		if (!executableLSP) {
			return;
		}

		const { path: newStarlarkPath, version: newStarlarkVersion } = executableLSP!;

		if (newStarlarkVersion !== starlarkLSPVersion || isOnTypeChange) {
			WorkspaceConfig.setToWorkspace("starlarkLSP", newStarlarkPath);
			this.extensionContext.setToContext("autokitteh.starlarkLSP", newStarlarkPath);
			this.extensionContext.setToContext("autokitteh.starlarkVersion", newStarlarkVersion);
			LoggerService.info(namespaces.startlarkLSPServer, translate().t("lsp.executableDownloadedSuccessfully"));
			commands.executeCommand(
				vsCommands.showInfoMessage,
				translate().t("lsp.executableDownloadedSuccessfully", { version: newStarlarkVersion })
			);
		}

		let serverOptions = {
			command: newStarlarkPath,
			args: starlarkLocalLSPDefaultArgs,
		};
		this.startLSPServer(serverOptions, clientOptions, newStarlarkVersion, newStarlarkPath);
	}

	private lspServerPathSettingsListener() {
		workspace.onDidChangeConfiguration((event) => {
			if (event.affectsConfiguration("autokitteh.starlarkLSP")) {
				this.languageClient?.stop();
				const { starlarkPath } = this.extensionContext.getLSPConfigurations();
				this.connecting = false;
				this.initiateLSPServer(starlarkPath, true);
			}
		});
		this.isListenerActivated = true;
	}

	private startLSPServer(
		serverOptions: ServerOptions,
		clientOptions: LanguageClientOptions,
		starlarkLSPVersion: string = "socket",
		starlarkPath: string
	) {
		const localStarlarkFileExist = fs.existsSync(starlarkPath);

		if (localStarlarkFileExist || ValidateURL(starlarkPath)) {
			LoggerService.info(
				namespaces.startlarkLSPServer,
				`Starting LSP Server (${starlarkLSPVersion}): ${starlarkPath} ${starlarkLocalLSPDefaultArgs.join(", ")}`
			);

			this.languageClient = new LanguageClient("Starlark", "autokitteh: Starlark LSP", serverOptions, clientOptions);

			this.languageClient.start();

			workspace.registerTextDocumentContentProvider(
				starlarkLSPUriScheme,
				new StarlarkFileHandler(this.languageClient!)
			);
		}
	}
}
