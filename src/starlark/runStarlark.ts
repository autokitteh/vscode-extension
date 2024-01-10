import { namespaces, vsCommands } from "@constants";
import {
	startlarkLSPPath,
	starlarkLSPPreloadDirPath,
	startlarkLSPServerType,
	lspStarlarkUriScheme,
} from "@constants/language";
import { StarlarkLSPServerType } from "@enums";
import { translate } from "@i18n";
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
			args.unshift("start");
		}
		if (starlarkLSPPreloadDirPath !== "") {
			args.push("--builtin-paths", starlarkLSPPreloadDirPath);
		}
	} else if (startlarkLSPServerType === StarlarkLSPServerType.rust) {
		if (args.indexOf("--lsp") === -1) {
			args.unshift("--lsp");
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
				return;
			}

			if (!client) {
				let serverOptions: ServerOptions = { command: startlarkLSPPath, args: args };

				let clientOptions: LanguageClientOptions = {
					documentSelector: [{ scheme: "file", language: "starlark" }],
					initializationOptions: {},
				};

				client = new LanguageClient(
					"Starlark",
					"autokitteh: Starlark language server",
					serverOptions,
					clientOptions
				);

				client.start();
			}
		}
	});
	workspace.onDidChangeConfiguration((event) => {
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
	});
};
