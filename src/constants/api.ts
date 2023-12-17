import { translate } from "@i18n/translation";
import { workspace, window } from "vscode";

const DEFAULT_HOST_URL = "http://localhost:9980";

const hostConfig = workspace.getConfiguration().get("autokitteh.baseURL") as string;
let HOST_URL = DEFAULT_HOST_URL;

try {
	const configURL = new URL(hostConfig);
	const HOST_ADDRESS = configURL.hostname;
	const HOST_PORT = configURL.port;
	if (!HOST_PORT.length) {
		window.showErrorMessage(translate().t("errors.badHostURL"));
	} else {
		HOST_URL = `http://${HOST_ADDRESS}:${HOST_PORT}`;
	}
} catch (er) {
	window.showErrorMessage(translate().t("errors.badHostURL"));
}

const URL_PREFIX = "autokitteh.";

export { HOST_URL, URL_PREFIX };
