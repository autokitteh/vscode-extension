import * as fs from "fs";
import { namespaces, starlarkLSPUriScheme, starlarkLocalLSPDefaultArgs, vsCommands } from "@constants";
import { translate } from "@i18n";
import {
	ExtensionContextService,
	StarlarkSocketStreamingService,
	LoggerService,
	StarlarkVersionManagerService,
} from "@services";
import { StarlarkFileHandler } from "@starlark";
import { ValidateURL, WorkspaceConfig } from "@utilities";
import { commands, workspace } from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions } from "vscode-languageclient";

export class StarlarkLSPService {
	private languageClient: LanguageClient | undefined = undefined;
	private extensionContext: ExtensionContextService;
	private starlarkLSPPath: string;

	public constructor(extensionContext: ExtensionContextService) {
		this.extensionContext = extensionContext;
		this.starlarkLSPPath = extensionContext.getLSPConfigurations().starlarkPath;
	}

	public async initiateLSPServer() {
		if (this.languageClient) {
			this.languageClient.stop();
		}

		let clientOptions: LanguageClientOptions = {
			documentSelector: [{ scheme: "file", language: "starlark" }],
			initializationOptions: {},
			outputChannelName: "autokitteh: Starlark LSP Server",
		};

		/* By default, the Starlark LSP operates through a CMD command in stdio mode.
		 * However, if the 'starlarkLSPSocketMode' is enabled, the LSP won't initiate automatically.
		 * Instead, VSCode connects to 'localhost:starlarkLSPPort', expecting the Starlark LSP to be running in socket mode. */
		if (ValidateURL(this.starlarkLSPPath)) {
			let serverURL = new URL(this.starlarkLSPPath);

			const port = (serverURL.port && Number(serverURL.port)) as number;
			const host = serverURL.hostname;
			if (!port || !host) {
				return;
			}

			const serverOptions = () => StarlarkSocketStreamingService.getServerOptionsStreamInfo(host, port);
			this.startLSPServer(serverOptions as ServerOptions, clientOptions, "socket");
			return;
		}

		const { starlarkPath, starlarkLSPVersion, extensionPath } = this.extensionContext.getLSPConfigurations();
		const executableLSP = await StarlarkVersionManagerService.updateLSPVersionIfNeeded(
			starlarkPath,
			starlarkLSPVersion,
			extensionPath
		);

		const { path: newStarlarkPath, version: newStarlarkVersion, error } = executableLSP!;
		if (error) {
			LoggerService.error(namespaces.startlarkLSPServer, error.message);
			commands.executeCommand(vsCommands.showErrorMessage, error.message);
		}

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
			command: this.starlarkLSPPath,
			args: starlarkLocalLSPDefaultArgs,
		};
		this.startLSPServer(serverOptions, clientOptions, newStarlarkVersion!);
	}

	private startLSPServer(
		serverOptions: ServerOptions,
		clientOptions: LanguageClientOptions,
		starlarkLSPVersion: string,
		starlarkLSPPath?: string
	) {
		const currentStarlarkLSPPath = starlarkLSPPath || this.starlarkLSPPath;
		const localStarlarkFileExist = fs.existsSync(currentStarlarkLSPPath);

		if (localStarlarkFileExist || ValidateURL(currentStarlarkLSPPath)) {
			// eslint-disable-next-line max-len
			const lspConfigurationMessage = `(${starlarkLSPVersion}): ${currentStarlarkLSPPath} ${starlarkLocalLSPDefaultArgs.join(", ")}`;
			LoggerService.info(namespaces.startlarkLSPServer, `Starting LSP Server ${lspConfigurationMessage}`);

			this.languageClient = new LanguageClient("Starlark", "autokitteh: Starlark LSP", serverOptions, clientOptions);

			this.languageClient.start();

			workspace.registerTextDocumentContentProvider(
				starlarkLSPUriScheme,
				new StarlarkFileHandler(this.languageClient!)
			);
		}
	}
}
