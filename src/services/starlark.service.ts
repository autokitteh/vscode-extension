import * as fs from "fs";
import { namespaces, vsCommands, starlarkLSPUriScheme, starlarkLocalLSPDefaultArgs } from "@constants";
import { translate } from "@i18n";
import {
	ExtensionContextService,
	StarlarkStreamingConnectionService,
	LoggerService,
	StarlarkVersionManagerService,
} from "@services";
import { StarlarkFileHandler } from "@starlark";
import { ValidateURL, WorkspaceConfig } from "@utilities";
import { workspace, commands } from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions } from "vscode-languageclient";

export class StarlarkLSPService {
	private languageClient: LanguageClient | undefined = undefined;
	private streamingConnectionManager: StarlarkStreamingConnectionService;
	private extensionContext: ExtensionContextService;

	public constructor(
		extensionContext: ExtensionContextService,
		streamingConnection: StarlarkStreamingConnectionService
	) {
		this.extensionContext = extensionContext;
		this.streamingConnectionManager = streamingConnection;
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
			/* By default, the Starlark LSP operates through a CMD command in stdio mode.
			 * However, if the 'starlarkLSPSocketMode' is enabled, the LSP won't initiate automatically.
			 * Instead, VSCode connects to 'localhost:starlarkLSPPort', expecting the Starlark LSP to be running in socket mode. */
			if (ValidateURL(starlarkPath)) {
				let serverURL = new URL(starlarkPath);

				const port = (serverURL.port && Number(serverURL.port)) as number;
				const host = serverURL.hostname;
				if (!port || !host) {
					return;
				}

				const serverOptions = () => this.streamingConnectionManager.getServerOptionsStreamInfo(host, port);
				this.startLSPServer(serverOptions as ServerOptions, clientOptions, "socket", starlarkPath);
				return;
			}

			this.streamingConnectionManager.closeConnection();
			this.initLocalLSP(clientOptions);
		} catch (error) {
			LoggerService.error(namespaces.startlarkLSPServer, (error as Error).message);
			commands.executeCommand(vsCommands.showErrorMessage, (error as Error).message);
		}
	}

	private async initLocalLSP(clientOptions: LanguageClientOptions) {
		let executableLSP;
		const { starlarkPath, starlarkLSPVersion, extensionPath } = this.extensionContext.getLSPConfigurations();

		executableLSP = await StarlarkVersionManagerService.updateLSPVersionIfNeeded(
			starlarkPath,
			starlarkLSPVersion,
			extensionPath
		);
		if (!executableLSP) {
			return;
		}

		const { path: newStarlarkPath, version: newStarlarkVersion } = executableLSP!;

		if (newStarlarkVersion !== starlarkLSPVersion) {
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
