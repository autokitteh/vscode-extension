import { getConfig } from "@constants/utilities";

export const starlarkLSPUriScheme = "starlark";
export const starlarkLSPPath: string | undefined = getConfig<string | undefined>(
	"autokitteh.starlarkLSPPath",
	undefined
);
export const starlarkLSPArgs: string[] = getConfig<string[]>("autokitteh.starlarkLSPArguments", ["start"]);
export const starlarkLSPLocalhost = "127.0.0.1";
export const starlarkExecutableGithubRepository =
	"https://api.github.com/repos/autokitteh/autokitteh-starlark-lsp/releases";
