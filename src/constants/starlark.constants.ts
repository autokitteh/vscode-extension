import { getConfig } from "@constants/utilities";

export const starlarkLSPUriScheme = "starlark";
export const starlarkLSPPath: string = getConfig<string>("autokitteh.starlarkLSPPath", "ak");
export const starlarkLSPArgs: string[] = getConfig<string[]>("autokitteh.starlarkLSPArguments", ["lsp"]);
export const starlarkLSPLocalhost = "127.0.0.1";
export const starlarkExecutableGithubRepository =
	"https://api.github.com/repos/autokitteh/autokitteh-starlark-lsp/releases";
