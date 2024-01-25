import { connect } from "net";
import { namespaces, vsCommands } from "@constants";
import {
	starlarkLSPPath,
	defaultStarlarkLSPArgs,
	starlarkLSPUriScheme,
	defaultStarlarkLSPPath,
} from "@constants/language";
import { translate } from "@i18n";
import { LoggerService } from "@services/logger.service";
import { StarlarkFileHandler } from "@starlark";
import { workspace, commands, ConfigurationChangeEvent } from "vscode";
import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	StreamInfo,
} from "vscode-languageclient";

const host = "127.0.0.1";

export class StarlarkLSPService {
	private static languageClient: LanguageClient | undefined = undefined;
	private static lspServerErrorDisplayed: boolean = false;

	public static init() {
		if (StarlarkLSPService.languageClient) {
			return;
		}
		this.initiateLSPServer();
		workspace.onDidChangeConfiguration(this.onChangeConfiguration);
	}

	private static initiateLSPServer() {
		workspace.registerTextDocumentContentProvider(
			starlarkLSPUriScheme,
			new StarlarkFileHandler(StarlarkLSPService.languageClient!)
		);
		if (StarlarkLSPService.languageClient) {
			return;
		}

		let args: string[] = workspace.getConfiguration().get("autokitteh.starlarkLSPArguments") || [];
		if (args.length === 0) {
			args = defaultStarlarkLSPArgs;
		}

		let lspPath = starlarkLSPPath || defaultStarlarkLSPPath;

		let serverOptions: ServerOptions | Promise<StreamInfo> = {
			command: lspPath,
			args: args,
		};

		let clientOptions: LanguageClientOptions = {
			documentSelector: [{ scheme: "file", language: "starlark" }],
			initializationOptions: {},
		};

		/* By default, the Starlark LSP operates through a CMD command in stdio mode.
		 * However, if the 'starlarkLSPSocketMode' is enabled, the LSP won't initiate automatically.
		 * Instead, VSCode connects to 'localhost:starlarkLSPPort', expecting the Starlark LSP to be running in socket mode. */
		const isLSPSocketMode = workspace
			.getConfiguration()
			.get("autokitteh.starlarkLSPSocketMode") as boolean;

		if (isLSPSocketMode) {
			const port = workspace.getConfiguration().get("autokitteh.starlarkLSPPort") as number;
			if (!port) {
				LoggerService.error(
					namespaces.startlarkLSPServer,
					translate().t("errors.missingStarlarkLSPPort")
				);
				commands.executeCommand(
					vsCommands.showErrorMessage,
					namespaces.startlarkLSPServer,
					translate().t("errors.missingStarlarkLSPPort")
				);

				return;
			}
			const socket = connect({ host, port });
			let streamListener: StreamInfo = { writer: socket, reader: socket };

			serverOptions = () => new Promise((resolve) => resolve(streamListener));
		}

		LoggerService.info(
			namespaces.startlarkLSPServer,
			`Starting LSP Server: ${lspPath} ${args.join(", ")}`
		);

		StarlarkLSPService.languageClient = new LanguageClient(
			"Starlark",
			"autokitteh: Starlark LSP",
			serverOptions,
			clientOptions
		);

		try {
			StarlarkLSPService.languageClient.start();
		} catch (error) {
			LoggerService.error(namespaces.deploymentsService, (error as Error).message);
		}
	}

	private static onChangeConfiguration(event: ConfigurationChangeEvent) {
		const settingsChanged =
			event.affectsConfiguration("autokitteh.starlarkLSPType") ||
			event.affectsConfiguration("autokitteh.autokitteh.starlarkLSPArguments");
		if (!settingsChanged) {
			return;
		}

		if (StarlarkLSPService.languageClient) {
			StarlarkLSPService.languageClient.stop();
			StarlarkLSPService.languageClient = undefined;
		}
		StarlarkLSPService.initiateLSPServer();
	}
}
