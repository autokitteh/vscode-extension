import { namespaces, vsCommands } from "@constants";
import {
	starlarkLSPPath,
	starlarkLSPPreloadDirPath,
	startlarkLSPServerType,
	starlarkLSPUriScheme,
} from "@constants/language";
import { StarlarkLSPServerType } from "@enums";
import { translate } from "@i18n";
import { StarlarkFileHandler } from "@starlark";
import { workspace, commands, ConfigurationChangeEvent } from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions } from "vscode-languageclient";

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

		let serverOptions: ServerOptions = { command: starlarkLSPPath, args: args };

		let clientOptions: LanguageClientOptions = {
			documentSelector: [{ scheme: "file", language: "starlark" }],
			initializationOptions: {},
		};

		StarlarkLSPService.languageClient = new LanguageClient(
			"Starlark",
			"autokitteh: Starlark LSP",
			serverOptions,
			clientOptions
		);

		StarlarkLSPService.languageClient.start();
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