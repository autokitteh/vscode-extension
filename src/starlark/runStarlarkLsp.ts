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
import { workspace, window, commands } from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions } from "vscode-languageclient";

let client: LanguageClient;

export const runStarlarkLSP = () => {
	workspace.registerTextDocumentContentProvider(
		starlarkLSPUriScheme,
		new StarlarkFileHandler(client)
	);

	let args: string[] = workspace.getConfiguration().get("autokitteh.starlarkLSPArguments") || [];
	let lspServerErrorDisplayed: boolean = false;

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

	window.onDidChangeActiveTextEditor((editor) => {
		if (editor && editor.document.languageId === "starlark") {
			if (
				(starlarkLSPPath === "" || starlarkLSPPreloadDirPath === "") &&
				!lspServerErrorDisplayed
			) {
				commands.executeCommand(
					vsCommands.showErrorMessage,
					namespaces.startlarkLSPServer,
					translate().t("errors.missingStarlarkLSPPath")
				);
				lspServerErrorDisplayed = true;
				return;
			}

			if (!client) {
				let serverOptions: ServerOptions = { command: starlarkLSPPath, args: args };

				let clientOptions: LanguageClientOptions = {
					documentSelector: [{ scheme: "file", language: "starlark" }],
					initializationOptions: {},
				};

				client = new LanguageClient(
					"Starlark",
					"autokitteh: Starlark LSP",
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
