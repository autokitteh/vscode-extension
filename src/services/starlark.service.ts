import { connect } from "net";
import { namespaces, starlarkLSPLocalhost, vsCommands } from "@constants";
import { starlarkLSPPath, starlarkLSPUriScheme, starlarkLSPArgs } from "@constants";
import { getConfig } from "@constants/utilities";
import { translate } from "@i18n";
import { LoggerService } from "@services/logger.service";
import { StarlarkFileHandler } from "@starlark";
import { downloadExecutable } from "@utilities/starlark";
import { workspace, commands, ConfigurationChangeEvent } from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions, StreamInfo } from "vscode-languageclient";

export class StarlarkLSPService {
	private static languageClient: LanguageClient | undefined = undefined;
	private static extensionPath: string;

	public static init(extensionPath: string) {
		if (StarlarkLSPService.languageClient) {
			return;
		}
		this.extensionPath = extensionPath;
		this.initiateLSPServer();
		workspace.onDidChangeConfiguration(this.onChangeConfiguration);
	}

	private static async initiateLSPServer() {
		workspace.registerTextDocumentContentProvider(
			starlarkLSPUriScheme,
			new StarlarkFileHandler(StarlarkLSPService.languageClient!)
		);
		if (StarlarkLSPService.languageClient) {
			return;
		}

		await downloadExecutable(this.extensionPath);

		let serverOptions: ServerOptions | Promise<StreamInfo> = {
			command: starlarkLSPPath,
			args: starlarkLSPArgs,
		};

		let clientOptions: LanguageClientOptions = {
			documentSelector: [{ scheme: "file", language: "starlark" }],
			initializationOptions: {},
		};

		/* By default, the Starlark LSP operates through a CMD command in stdio mode.
		 * However, if the 'starlarkLSPSocketMode' is enabled, the LSP won't initiate automatically.
		 * Instead, VSCode connects to 'localhost:starlarkLSPPort', expecting the Starlark LSP to be running in socket mode. */
		const isLSPSocketMode = workspace.getConfiguration().get("autokitteh.starlarkLSPSocketMode") as boolean;

		if (isLSPSocketMode) {
			const port = getConfig<number>("autokitteh.starlarkLSPPort", 0);
			if (!port) {
				LoggerService.error(namespaces.startlarkLSPServer, translate().t("errors.missingStarlarkLSPPort"));
				commands.executeCommand(
					vsCommands.showErrorMessage,
					namespaces.startlarkLSPServer,
					translate().t("errors.missingStarlarkLSPPort")
				);

				return;
			}
			const socket = connect({ host: starlarkLSPLocalhost, port });
			let streamListener: StreamInfo = { writer: socket, reader: socket };

			serverOptions = () => new Promise((resolve) => resolve(streamListener));
		}

		LoggerService.info(
			namespaces.startlarkLSPServer,
			`Starting LSP Server: ${starlarkLSPPath} ${starlarkLSPArgs.join(", ")}`
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
