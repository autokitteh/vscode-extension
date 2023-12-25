import { ConnectionHandler } from "@controllers/utilities/connectionHandler";
import { ServiceResponse } from "@type/services.types";
import { MessageHandler } from "@views";

export class ResponseHandler {
	static async handleServiceResponse<T>(
		responsePromise: ServiceResponse<T>,
		onSuccessMessage?: string,
		onFailureMessage?: string
	) {
		if (!(await ConnectionHandler.getConnectionStatus())) {
			await ConnectionHandler.updateConnectionStatus(false);
			ConnectionHandler.reconnect();
			return;
		}
		try {
			const response = await responsePromise;

			if (!response.error) {
				if (onSuccessMessage) {
					MessageHandler.infoMessage(onSuccessMessage);
				}
				return response.data as T;
			}
		} catch (error) {
			await ConnectionHandler.updateConnectionStatus(false);

			ResponseHandler.displayErrorMessage(
				error instanceof Error
					? error
					: onFailureMessage
						? new Error(onFailureMessage)
						: new Error(error as string)
			);
		}
	}

	static displayErrorMessage(error: Error) {
		MessageHandler.errorMessage(error.message);
	}
}
