import { getConfig } from "@constants/utilities";

export const starlarkLSPUriScheme = "starlark";
export const starlarkLSPPath: string = getConfig<string>("autokitteh.baseURL", "ak");
export const startlarkLSPServerType: string = getConfig<string>("autokitteh.starlarkLSPType", "");
export const starlarkLSPPreloadDirPath: string = getConfig<string>(
	"starlarkLSPPreloadDir.baseURL",
	""
);
export const starlarkLSPArgs: string[] = getConfig<string[]>("autokitteh.starlarkLSPArguments", [
	"lsp",
]);
