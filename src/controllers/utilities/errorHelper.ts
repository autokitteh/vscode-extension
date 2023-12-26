import { ConnectError } from "@connectrpc/connect";
import { vsCommands } from "@constants";
import { translate } from "@i18n/translation.i18n";
import { commands } from "vscode";

export const errorHelper = (error: unknown, onFailureMessage?: string) => {
	let errorMessage = translate().t(["errors.unexpectedError"]);
	if (onFailureMessage) {
		errorMessage = translate().t(onFailureMessage);
		if (error instanceof ConnectError) {
			const { code, message } = error;
			errorMessage = `${errorMessage}. [${code}]: ${message}`;
		} else if (error instanceof Error) {
			const { message } = error;
			errorMessage = `${errorMessage}. ${message}`;
		} else if (typeof error === "string") {
			errorMessage = `${errorMessage}. ${error}`;
		}
	}
	commands.executeCommand(vsCommands.showErrorMessage, errorMessage);
};
