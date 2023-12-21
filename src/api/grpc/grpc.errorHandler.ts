import { ConnectError } from "@connectrpc/connect";
import { MessageHandler } from "@views";

export const handlegRPCErrors = (error: any) => {
	if (error instanceof ConnectError) {
		const errorMessage = `Error code: ${error.code}, error message: ${error.message}`;
		console.error(errorMessage);
		MessageHandler.errorMessage(errorMessage);
	} else {
		const errorMessage = `Error occured: ${error}`;
		console.error(errorMessage);
		MessageHandler.errorMessage(errorMessage);
	}
};
