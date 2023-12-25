import { ConnectError } from "@connectrpc/connect";
import { vsCommands } from "@constants";
import { gRPCErrors } from "@constants/api.constants";
import { ConnectionHandler } from "@controllers/utilities/connectionHandler";
import { translate } from "@i18n";
import { ServiceResponse } from "@type/services.types";
import { commands } from "vscode";

export class RequestHandler {
	static async handleServiceResponse<T>(
		requestPromise: () => Promise<ServiceResponse<T>>,
		messages?: {
			onSuccessMessage?: string;
			onFailureMessage?: string;
		}
	): Promise<T | undefined> {
		if (!ConnectionHandler.isConnected) {
			return;
		}
		const { error, data } = await requestPromise();

		if (!error) {
			if (messages?.onSuccessMessage) {
				commands.executeCommand(vsCommands.showInfoMessage, messages.onSuccessMessage);
			}
			return data as T;
		} else if (error && data) {
			const errorMessage = messages?.onFailureMessage
				? messages.onFailureMessage
				: translate().t("errors.unexpectedError");

			commands.executeCommand(vsCommands.showErrorMessage, errorMessage);

			return data as T;
		} else {
			if (error instanceof ConnectError && error.code === gRPCErrors.serverNotRespond) {
				commands.executeCommand(
					vsCommands.showErrorMessage,
					translate().t("errors.serverNotRespond")
				);
				ConnectionHandler.reconnect();
			}

			const errorMessage = messages?.onFailureMessage
				? messages.onFailureMessage
				: error || translate().t("errors.unexpectedError");

			commands.executeCommand(vsCommands.showErrorMessage, errorMessage);
		}
		return;
	}
}
