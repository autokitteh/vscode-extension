import { ExtensionContext } from "vscode";

export const starlarkLSPUriScheme = "starlark";
export const starlarkLSPPath = (context: ExtensionContext): string =>
	context.workspaceState.get<string>("autokitteh.starlarkLSPPath", "");
export const starlarkLSPArgs = (context: ExtensionContext): string[] =>
	context.workspaceState.get<string[]>("autokitteh.starlarkLSPArguments", ["start"]);

export const starlarkLSPLocalhost = "127.0.0.1";
export const starlarkExecutableGithubRepository =
	"https://api.github.com/repos/autokitteh/autokitteh-starlark-lsp/releases";
export const starlarkLSPExtractedDirectory = "autokitteh-lsp";
