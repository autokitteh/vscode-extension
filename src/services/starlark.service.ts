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
import { workspace, window, commands, TextEditor, ConfigurationChangeEvent } from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions } from "vscode-languageclient";

export class StarlarkLSPService {
	private static languageClient: LanguageClient | undefined = undefined;
	private static lspServerErrorDisplayed: boolean = false;

	public static init() {
		if (StarlarkLSPService.languageClient) {
			return;
		}
		this.initiateLSPServer();
		window.onDidChangeActiveTextEditor(this.onChangeActiveTextEditor);
		workspace.onDidChangeConfiguration(this.onChangeConfiguration);
	}

	private static initiateLSPServer() {
		workspace.registerTextDocumentContentProvider(
			starlarkLSPUriScheme,
			new StarlarkFileHandler(StarlarkLSPService.languageClient!)
		);
	}

	private static onChangeConfiguration(event: ConfigurationChangeEvent) {
		const settingsChanged = event.affectsConfiguration("autokitteh.starlarkLSPType");
		if (settingsChanged) {
			const newStarlarkLSPType =
				workspace.getConfiguration().get("autokitteh.starlarkLSPType") || "";

			if (newStarlarkLSPType === StarlarkLSPServerType.tilt) {
				workspace.getConfiguration().update("autokitteh.starlarkLSPArguments", ["start"]);
			} else if (newStarlarkLSPType === StarlarkLSPServerType.rust) {
				workspace.getConfiguration().update("autokitteh.starlarkLSPArguments", ["--lsp"]);
			}
		}
	}
	private static onChangeActiveTextEditor(editor: TextEditor | undefined) {
		let args: string[] = workspace.getConfiguration().get("autokitteh.starlarkLSPArguments") || [];

		switch (startlarkLSPServerType) {
			case StarlarkLSPServerType.tilt:
				if (args.indexOf("start") === -1) {
					args.unshift("start");
				}
				if (starlarkLSPPreloadDirPath !== "") {
					args.push("--builtin-paths", starlarkLSPPreloadDirPath);
				}
				break;
			case StarlarkLSPServerType.rust:
				if (args.indexOf("--lsp") === -1) {
					args.unshift("--lsp");
				}
				if (starlarkLSPPreloadDirPath !== "") {
					args.push("--prelude", starlarkLSPPreloadDirPath);
				}
				break;
		}

		if (editor && editor.document.languageId === "starlark") {
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

			if (!StarlarkLSPService.languageClient) {
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
		}
	}
}
