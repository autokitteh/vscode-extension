import { Uri, window, workspace } from "vscode";

export const TILT = "tilt";
const SECTION = "tiltfile";

export function getConfig(uri?: Uri) {
	if (!uri) {
		if (window.activeTextEditor) {
			uri = window.activeTextEditor.document.uri;
		}
	}
	return workspace.getConfiguration(SECTION, uri);
}

export type Port = number | null;
export function getServerPort(): Port {
	return getConfig().get<Port>("server.port") || 8080;
}

export function getTrace(): string {
	return getConfig().get<string>("trace.server") || "off";
}

export function getTiltPath(): string {
	const path = getConfig().get<string>("tilt.path");
	if (path === null) {
		return TILT;
	}
	return path || TILT;
}

export function getShowStatusBarButton(): boolean {
	return getConfig().get<boolean>("showStatusBarButton") || true;
}

export function getTiltWebUIPort(): number {
	return getConfig().get<number>("tilt.webui.port") || 10350;
}
