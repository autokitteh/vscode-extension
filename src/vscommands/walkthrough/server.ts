import { DEFAULT_SERVER_URL } from "@constants";
import { AppSync } from "@controllers/AppSync";
import { translate } from "@i18n/translation";
import { LocalhostConnection } from "@type/connection";
import { TestURL } from "@utilities";
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
	const hostBaseURL = TestURL(baseURL);
	if (hostBaseURL) {
		workspace.getConfiguration().update("autokitteh.baseURL", hostBaseURL);
		window.showInformationMessage(translate().t("messages.baseURLUpdated"));
	} else {
		window.showErrorMessage(translate().t("errors.badHostURL"));
	}
};

export const connectAK = async (connection: LocalhostConnection): Promise<LocalhostConnection> => {
	return await AppSync.pollData(connection, undefined);
};
