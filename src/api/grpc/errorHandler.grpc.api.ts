import { ConnectError } from "@connectrpc/connect";
import { vsCommands } from "@constants";
import { gRPCErrors } from "@constants/api.constants";
import { MessageHandler } from "@views";
import { commands } from "vscode";

export const handlegRPCErrors = async (error: unknown) => {
	if (error instanceof ConnectError) {
		const errorMessage = `Error code: ${error.code}, error message: ${error.message}`;
		console.error(errorMessage);
		MessageHandler.errorMessage(errorMessage);

		if (error.code === gRPCErrors.serverNotRespond) {
			commands.executeCommand(vsCommands.disconnect);
		}
		return;
	}

	const errorMessage = `Error occured: ${error}`;
	console.error(errorMessage);
	MessageHandler.errorMessage(errorMessage);
};
