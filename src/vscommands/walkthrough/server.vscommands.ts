import { window, commands, workspace } from "vscode";

import { DEFAULT_SERVER_URL, vsCommands } from "@constants";
import { translate } from "@i18n";
import { ValidateURL } from "@utilities";

export const openBaseURLInputDialog = async () => {
	let baseURL = await window.showInputBox({
		placeHolder: translate().t("walkthrough.setHostInputDialog"),
	});
	if (!baseURL || baseURL.length === 0) {
		baseURL = DEFAULT_SERVER_URL;
	}

	setBaseURL(baseURL);
};

export const setBaseURL = async (baseURL: string) => {
	const hostBaseURL = ValidateURL(baseURL);
	if (hostBaseURL) {
		workspace.getConfiguration().update("autokitteh.baseURL", baseURL);
		commands.executeCommand(vsCommands.showInfoMessage, translate().t("messages.baseURLUpdated"));
		commands.executeCommand(vsCommands.baseURLUpdated);
	} else {
		commands.executeCommand(vsCommands.showErrorMessage, translate().t("errors.walkthrough.badBaseURL"));
	}
};
