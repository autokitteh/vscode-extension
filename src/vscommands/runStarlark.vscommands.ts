import { namespaces, starlarkUriScheme, vsCommands } from "@constants";
import { LspServerType } from "@enums";
import { translate } from "@i18n/index";
import { StarlarkFileHandler } from "@models/language";
import { workspace, window, commands } from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions } from "vscode-languageclient";

let client: LanguageClient;

export const runStarlark = () => {
	// Make sure that any starlark: URIs that come back from the LSP
	// are handled, and requested from the LSP.
	workspace.registerTextDocumentContentProvider(starlarkUriScheme, new StarlarkFileHandler(client));

	const path: string = workspace.getConfiguration().get("autokitteh.starlarkLSPPath") || "";
	const lspServerType: string | undefined = workspace
		.getConfiguration()
		.get("autokitteh.starlarkLSPType");
	const preloadDirPath: string =
		workspace.getConfiguration().get("autokitteh.starlarkLSPPreloadDir") || "";
	let args: string[] = workspace.getConfiguration().get("autokitteh.starlarkLSPArguments") || [];
	let lspServerErrorDisplayed: boolean = false;

	if (lspServerType === LspServerType.tilt) {
		if (args.indexOf("start") === -1) {
			args.push("start");
		}
		if (preloadDirPath !== "") {
			args.push("--builtin-paths", preloadDirPath);
		}
	} else {
		if (args?.indexOf("--lsp") === -1) {
			args.push("--lsp");
		}
		if (preloadDirPath !== "") {
			args.push("--prelude", preloadDirPath);
		}
	}

	window.onDidChangeActiveTextEditor((editor) => {
		if (editor && editor.document.languageId === "starlark") {
			if ((path === "" || preloadDirPath === "") && !lspServerErrorDisplayed) {
				commands.executeCommand(
					vsCommands.showErrorMessage,
					namespaces.lspServer,
					translate().t("errors.lspPathNotSet")
				);
				lspServerErrorDisplayed = true;
			} else if (!client) {
				let serverOptions: ServerOptions = { command: path, args: args };

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
