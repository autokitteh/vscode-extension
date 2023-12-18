import { DEFAULT_SERVER_URL } from "@constants";
import { translate } from "@i18n";
import { TestURL } from "@utilities";
import { window, commands, workspace } from "vscode";

export const getBaseURL = async () => {
	let baseURL = await window.showInputBox({
		placeHolder: "Type the server URL (leave empty for the default: 'http://localhost:9980')",
	});
	if (!baseURL || baseURL.length === 0) {
		baseURL = DEFAULT_SERVER_URL;
	}
	commands.executeCommand("autokitteh.setBaseURL", baseURL);
};

export const setBaseURL = async (baseURL: string) => {
	const hostBaseURL = TestURL(baseURL);
	if (hostBaseURL) {
		workspace.getConfiguration().update("autokitteh.baseURL", hostBaseURL);
		window.showInformationMessage(translate().t("messages.baseURLUpdated"));
	} else {
		window.showErrorMessage(translate().t("errors.badBaseURL"));
	}
};
