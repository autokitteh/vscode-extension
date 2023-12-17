import { DEFAULT_SERVER_URL } from "@constants";
import { AppSync } from "@controllers/AppSync";
import { LocalhostConnection } from "@type/connection";
import { window, commands, workspace } from "vscode";

export const getBaseURL = async () => {
	let baseURL = await window.showInputBox({
		placeHolder: "Type the server URL (leave empty for the default: 'http://localhost:9980')",
	});
	if (!baseURL || baseURL.length === 0) {
		baseURL = DEFAULT_SERVER_URL;
	}
	commands.executeCommand("autokitteh.v2.setBaseURL", baseURL);
};

export const setBaseURL = async (baseURL: string) => {
	workspace.getConfiguration().update("autokitteh.baseURL", baseURL);
};

export const connectAK = async (connection: LocalhostConnection): Promise<LocalhostConnection> => {
	return await AppSync.pollData(connection, undefined);
};
