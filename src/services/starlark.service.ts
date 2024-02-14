import * as fs from "fs";
import { namespaces, vsCommands, starlarkLSPUriScheme } from "@constants";
import { translate } from "@i18n";
import { ConfigurationManagerService, LoggerService, NetworkClientService, VersionManagerService } from "@services";
import { StarlarkFileHandler } from "@starlark";
import { ValidateURL } from "@utilities";
import { workspace, commands } from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions } from "vscode-languageclient";

export class StarlarkLSPService {
	private languageClient: LanguageClient | undefined = undefined;
	private networkManager: NetworkClientService;
	private versionManager: VersionManagerService;
	private configurationManager: ConfigurationManagerService;

	private connecting: boolean = false;
	private isListenerActivated: boolean = false;

	public constructor(
		configurationManager: ConfigurationManagerService,
		networkManager: NetworkClientService,
		versionManager: VersionManagerService
	) {
		this.configurationManager = configurationManager;
		this.networkManager = networkManager;
		this.versionManager = versionManager;
	}

	public async initiateLSPServer(starlarkPath: string) {
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
			this.initLocalLSP(clientOptions);
		} catch (error) {
			LoggerService.error(namespaces.startlarkLSPServer, (error as Error).message);
			commands.executeCommand(vsCommands.showErrorMessage, (error as Error).message);
		}
	}

	private async initLocalLSP(clientOptions: LanguageClientOptions) {
		let executableLSP;
		const { starlarkPath, starlarkLSPArgs, starlarkLSPVersion, extensionPath } =
			this.configurationManager.getLSPConfigurations();

		executableLSP = await this.versionManager.updateLSPVersionIfNeeded(starlarkPath, starlarkLSPVersion, extensionPath);
		if (!executableLSP) {
			return;
		}

		const { path: newStarlarkPath, version: newStarlarkVersion } = executableLSP!;

		if (newStarlarkVersion !== starlarkLSPVersion) {
			this.configurationManager.setToWorkspace("starlarkLSP", newStarlarkPath);
			this.configurationManager.setToWorkspaceContext("autokitteh.starlarkLSP", newStarlarkPath);
			this.configurationManager.setToWorkspaceContext("autokitteh.starlarkVersion", newStarlarkVersion);
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
		this.startLSPServer(serverOptions, clientOptions, newStarlarkVersion, newStarlarkPath);
	}

	private lspServerPathSettingsListener() {
		workspace.onDidChangeConfiguration((event) => {
			if (event.affectsConfiguration("autokitteh.starlarkLSP")) {
				this.languageClient?.stop();
				const { starlarkPath } = this.configurationManager.getLSPConfigurations();
				this.connecting = false;
				this.initiateLSPServer(starlarkPath);
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
		const { starlarkLSPArgs } = this.configurationManager.getLSPConfigurations();
		const localStarlarkFileExist = fs.existsSync(starlarkPath);

		if (localStarlarkFileExist || ValidateURL(starlarkPath)) {
			LoggerService.info(
				namespaces.startlarkLSPServer,
				`Starting LSP Server (${starlarkLSPVersion}): ${starlarkPath} ${starlarkLSPArgs.join(", ")}`
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
