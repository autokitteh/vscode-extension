import { commands, ConfigurationTarget, window, workspace } from "vscode";

import { vsCommands } from "@constants";
import { translate } from "@i18n";

export const setToken = async () => {
	const inputToken = await window.showInputBox({ prompt: translate().t("token.enterToken") });

	if (inputToken) {
		const config = workspace.getConfiguration();
		await config.update("autokitteh.authToken", inputToken, ConfigurationTarget.Workspace);

		commands.executeCommand(vsCommands.showInfoMessage, translate().t("token.saved"));
	} else {
		commands.executeCommand(vsCommands.showErrorMessage, translate().t("token.emtpy"));
	}
};
