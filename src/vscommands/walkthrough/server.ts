import { DEFAULT_SERVER_URL } from "@constants";
import { AppSync } from "@controllers/AppSync";
import { LocalhostConnection } from "@type/connection";
import { window, commands, workspace } from "vscode";

export const getAKEndpoint = async () => {
	let akEndpoint = await window.showInputBox({
		placeHolder: "Type the server URL (leave empty for the default: 'http://localhost:9980')",
	});
	if (!akEndpoint || akEndpoint.length === 0) {
		akEndpoint = DEFAULT_SERVER_URL;
	}
	commands.executeCommand("autokitteh.v2.setAKEndpoint", akEndpoint);
};

export const setAKEndpoint = async (akEndpoint: string) => {
	workspace.getConfiguration().update("autokitteh.akEndpoint", akEndpoint);
};

export const connectAK = async (connection: LocalhostConnection): Promise<LocalhostConnection> => {
	return await AppSync.pollData(connection, undefined);
};
