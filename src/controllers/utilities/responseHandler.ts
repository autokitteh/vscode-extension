import { ConnectError } from "@connectrpc/connect";
import { ConnectionHandler } from "@controllers/utilities/connectionHandler";
import { translate } from "@i18n";
import { ServiceResponse } from "@type/services.types";
import { MessageHandler } from "@views";

export class ResponseHandler {
	static async handleServiceResponse<T>(
		responsePromise: ServiceResponse<T>,
		onSuccessMessage?: string,
		onFailureMessage?: string
	) {
		const isConnected = await ConnectionHandler.getConnectionStatus();
		if (!isConnected) {
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
			} else if (response.error && response.data) {
				MessageHandler.errorMessage(translate().t("errors.unexpectedError"));

				return response.data as T;
			}
		} catch (error) {
			await ConnectionHandler.updateConnectionStatus(false);

			const errorMessage =
				error instanceof Error || error instanceof ConnectError
					? error.message
					: onFailureMessage
						? onFailureMessage
						: translate().t("errors.unexpectedError");

			MessageHandler.errorMessage(errorMessage);
		}
	}
}
