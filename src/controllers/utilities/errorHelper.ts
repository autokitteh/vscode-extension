import { ConnectError } from "@connectrpc/connect";
import { vsCommands } from "@constants";
import { gRPCErrors } from "@constants/api.constants";
import { ConnectionHandler } from "@controllers/utilities/connectionHandler";
import { translate } from "@i18n/translation.i18n";
import { commands } from "vscode";

export const errorHelper = (error: unknown, errorMessage?: string) => {
	if (error instanceof ConnectError && error.code === gRPCErrors.serverNotRespond) {
		commands.executeCommand(vsCommands.showErrorMessage, translate().t("errors.serverNotRespond"));
		ConnectionHandler.reconnect();
	} else {
		const errorMessageToDisplay = errorMessage
			? errorMessage
			: typeof error === "string"
				? error
				: error instanceof Error
					? error.message
					: translate().t("errors.unexpectedError");

		commands.executeCommand(vsCommands.showErrorMessage, errorMessageToDisplay);
	}
};
