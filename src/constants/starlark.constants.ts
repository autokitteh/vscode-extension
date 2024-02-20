import { LanguageClientOptions } from "vscode-languageclient";

export const starlarkLSPUriScheme = "starlark";
export const starlarkExecutableGithubRepository =
	"https://api.github.com/repos/autokitteh/autokitteh-starlark-lsp/releases";
export const starlarkLSPExtractedDirectory = "autokitteh-lsp";
export const starlarkLocalLSPDefaultArgs = ["start"];
export const starlarkLSPSocketReconnectRefreshRate = 5000;
export const starlarkLSPClientOptions: LanguageClientOptions = {
	documentSelector: [{ scheme: "file", language: "starlark" }],
	initializationOptions: {},
	outputChannelName: "autokitteh: Starlark LSP Server",
};
