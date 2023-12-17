import { DEFAULT_USERNAME } from "@constants";
import { window, commands, workspace } from "vscode";

export const getUsername = async () => {
	let username = await window.showInputBox({
		placeHolder: "Type your username (leave empty for the default: 'anonymous')",
	});
	if (!username || username.length === 0) {
		username = DEFAULT_USERNAME;
	}
	commands.executeCommand("autokitteh.v2.setUsername", username);
};

export const setUsername = async (username: string) => {
	workspace.getConfiguration().update("autokitteh.username", username);
};
