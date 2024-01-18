import { connect } from "net";
import { namespaces, vsCommands } from "@constants";
import {
	starlarkLSPPath,
	starlarkLSPPreloadDirPath,
	startlarkLSPServerType,
	starlarkLSPUriScheme,
} from "@constants/language";
import { LoggerLevel, StarlarkLSPServerType } from "@enums";
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

	private static async initiateLSPServer() {
		workspace.registerTextDocumentContentProvider(
			starlarkLSPUriScheme,
			new StarlarkFileHandler(StarlarkLSPService.languageClient!)
		);
		if (StarlarkLSPService.languageClient) {
			return;
		}

		let args: string[] = workspace.getConfiguration().get("autokitteh.starlarkLSPArguments") || [];

		this.getStarlarkLSPArguments(startlarkLSPServerType, args);

		if (
			(starlarkLSPPath === "" || starlarkLSPPreloadDirPath === "") &&
			!this.lspServerErrorDisplayed
		) {
			commands.executeCommand(
				vsCommands.showErrorMessage,
				namespaces.startlarkLSPServer,
				translate().t("errors.missingStarlarkLSPPath")
			);
			this.lspServerErrorDisplayed = true;
			return;
		}

		let serverOptions: ServerOptions | Promise<StreamInfo> = {
			command: starlarkLSPPath,
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
			if (port) {
				const socket = connect({ host, port });
				let streamListener: StreamInfo = { writer: socket, reader: socket };

				serverOptions = () => new Promise((resolve) => resolve(streamListener));
			}
		}

		StarlarkLSPService.languageClient = new LanguageClient(
			"Starlark",
			"autokitteh: Starlark LSP",
			serverOptions,
			clientOptions
		);

		try {
			StarlarkLSPService.languageClient.start();
		} catch (error) {
			LoggerService.log(namespaces.deploymentsService, (error as Error).message, LoggerLevel.error);
		}
	}

	private static getStarlarkLSPArguments(lspServerType: string, args: string[]): void {
		switch (lspServerType) {
			case StarlarkLSPServerType.tilt:
				if (args.indexOf("start") === -1) {
					args.push("start");
				}
				if (starlarkLSPPreloadDirPath !== "") {
					args.push("--builtin-paths", starlarkLSPPreloadDirPath);
				}
				break;
			case StarlarkLSPServerType.rust:
				if (args.indexOf("--lsp") === -1) {
					args.push("--lsp");
				}
				if (starlarkLSPPreloadDirPath !== "") {
					args.push("--prelude", starlarkLSPPreloadDirPath);
				}
				break;
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
