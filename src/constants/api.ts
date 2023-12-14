import { workspace } from "vscode";

const HOST_ADDRESS =
	workspace.getConfiguration().get("autokitteh.host.address") || "http://localhost";
const HOST_PORT = workspace.getConfiguration().get("autokitteh.host.url") || "9980";

export const HOST_URL = `${HOST_ADDRESS}:${HOST_PORT}`;

export const URL_PREFIX = "autokitteh.";
