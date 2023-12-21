import { DEFAULT_SERVER_URL, vsCommands } from "@constants";
import { translate } from "@i18n";
import { ValidateURL } from "@utilities";
import { MessageHandler } from "@views";
import { window, commands, workspace } from "vscode";

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
		workspace.getConfiguration().update("autokitteh.baseURL", hostBaseURL);
		MessageHandler.infoMessage(translate().t("messages.baseURLUpdated"));
		commands.executeCommand(vsCommands.baseURLUpdated);
	} else {
		MessageHandler.errorMessage(translate().t("errors.badBaseURL"));
	}
};
