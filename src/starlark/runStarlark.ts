import { namespaces, vsCommands } from "@constants";
import {
	startlarkLSPPath,
	starlarkLSPPreloadDirPath,
	startlarkLSPServerType,
	lspStarlarkUriScheme,
} from "@constants/language";
import { StarlarkLSPServerType } from "@enums";
import { translate } from "@i18n/index";
import { StarlarkFileHandler } from "@models/language";
import { workspace, window, commands } from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions } from "vscode-languageclient";

let client: LanguageClient;

export const runStarlark = () => {
	workspace.registerTextDocumentContentProvider(
		lspStarlarkUriScheme,
		new StarlarkFileHandler(client)
	);

	let args: string[] = workspace.getConfiguration().get("autokitteh.starlarkLSPArguments") || [];
	let lspServerErrorDisplayed: boolean = false;

	if (startlarkLSPServerType === StarlarkLSPServerType.tilt) {
		if (args.indexOf("start") === -1) {
			args.push("start");
		}
		if (starlarkLSPPreloadDirPath !== "") {
			args.push("--builtin-paths", starlarkLSPPreloadDirPath);
		}
	} else {
		if (args?.indexOf("--lsp") === -1) {
			args.push("--lsp");
		}
		if (starlarkLSPPreloadDirPath !== "") {
			args.push("--prelude", starlarkLSPPreloadDirPath);
		}
	}

	window.onDidChangeActiveTextEditor((editor) => {
		if (editor && editor.document.languageId === "starlark") {
			if (
				(startlarkLSPPath === "" || starlarkLSPPreloadDirPath === "") &&
				!lspServerErrorDisplayed
			) {
				commands.executeCommand(
					vsCommands.showErrorMessage,
					namespaces.startlarkLSPServer,
					translate().t("errors.lspPathNotSet")
				);
				lspServerErrorDisplayed = true;
			} else if (!client) {
				let serverOptions: ServerOptions = { command: startlarkLSPPath, args: args };

				let clientOptions: LanguageClientOptions = {
					documentSelector: [{ scheme: "file", language: "starlark" }],
					initializationOptions: {},
				};

				client = new LanguageClient(
					"Starlark",
					"Starlark language server",
					serverOptions,
					clientOptions
				);

				client.start();
			}
		}
	});
};
