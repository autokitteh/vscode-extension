import { ConnectError } from "@connectrpc/connect";
import { MessageHandler } from "@views";

export const handlegRPCErrors = async (error: unknown) => {
	if (error instanceof ConnectError) {
		// check code for connection error

		const errorMessage = `Error code: ${error.code}, error message: ${error.message}`;
		console.error(errorMessage);
		MessageHandler.errorMessage(errorMessage);
		return;
	}

	const errorMessage = `Error occured: ${error}`;
	console.error(errorMessage);
	MessageHandler.errorMessage(errorMessage);
};
