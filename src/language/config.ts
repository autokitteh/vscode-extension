import { Uri, window, workspace } from "vscode";

export const STARLARK_LSP = "starlark-lsp";
const SECTION = "autokitteh";

export function getConfig(uri?: Uri) {
	if (!uri) {
		if (window.activeTextEditor) {
			uri = window.activeTextEditor.document.uri;
		}
	}
	console.log(workspace.getConfiguration(SECTION, uri));

	return workspace.getConfiguration(SECTION, uri);
}

export type Port = number | null;
export function getServerPort(): Port {
	return getConfig().get<Port>("starlark-lsp.port") || 8080;
}

export function getTrace(): string {
	return getConfig().get<string>("starlark-lsp.trace") || "off";
}

export function getArguments(): string {
	return getConfig().get<string>("autokitteh.starlark-lsp.arguments") || "";
}

export function getStarlarkLSPPath(): string {
	const path = getConfig().get<string>("starlark-lsp.path");
	if (path === null) {
		return STARLARK_LSP;
	}
	return path || STARLARK_LSP;
}
