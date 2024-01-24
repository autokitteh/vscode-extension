import { workspace } from "vscode";

export const starlarkLSPUriScheme = "starlark";
export const starlarkLSPPath: string =
	workspace.getConfiguration().get("autokitteh.starlarkLSPPath") || "";
export const startlarkLSPServerType: string =
	workspace.getConfiguration().get("autokitteh.starlarkLSPType") || "";
export const starlarkLSPPreloadDirPath: string =
	workspace.getConfiguration().get("autokitteh.starlarkLSPPreloadDir") || "";
export const defaultStarlarkLSPPath: string = "ak";
export const defaultStarlarkLSPArg: string[] = ["lsp"];
