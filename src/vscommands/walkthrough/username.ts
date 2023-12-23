import { DEFAULT_USERNAME, vsCommands } from "@constants";
import { translate } from "@i18n";
import { MessageHandler } from "@views";
import { window, commands, workspace } from "vscode";

export const openUsernameInputDialog = async () => {
	let username = await window.showInputBox({
		placeHolder: translate().t("walkthrough.setUsernameInputDialog"),
	});
	if (!username) {
		username = DEFAULT_USERNAME;
	}
	if (username && username.length < 3) {
		MessageHandler.errorMessage(translate().t("walkthrough.minimalUsernameLength"));
	}
	await setUsername(username);
};

export const setUsername = async (username: string) => {
	workspace.getConfiguration().update("autokitteh.username", username);
	MessageHandler.infoMessage(translate().t("messages.usernameUpdated"));
	commands.executeCommand(vsCommands.usernameUpdated);
};
