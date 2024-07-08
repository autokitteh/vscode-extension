import { commands, window } from "vscode";

import { vsCommands } from "@constants";
import { translate } from "@i18n";

export const setToken = async () => {
	const inputToken = await window.showInputBox({ prompt: translate().t("token.enterToken") });

	if (inputToken) {
		await commands.executeCommand(vsCommands.setContext, "authToken", inputToken);
		commands.executeCommand(vsCommands.showInfoMessage, translate().t("token.saved"));
	} else {
		commands.executeCommand(vsCommands.showErrorMessage, translate().t("token.emtpy"));
	}
};
