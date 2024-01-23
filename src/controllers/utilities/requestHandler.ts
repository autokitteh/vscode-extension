import { ConnectError } from "@connectrpc/connect";
import { namespaces, vsCommands } from "@constants";
import { gRPCErrors } from "@constants/api.constants";
import { ServiceResponse } from "@type/services.types";
import { commands } from "vscode";

export class RequestHandler {
	static disconnectedErrorDisplayed: boolean = false;

	static async handleServiceResponse<T>(
		requestPromise: () => Promise<ServiceResponse<T>>,
		messages?: {
			onSuccessMessage?: string;
			onFailureMessage?: string;
		}
	): Promise<{ data: T | undefined; error: unknown }> {
		const { error, data } = await requestPromise();
		if (!error) {
			let isDataStringId = false;
			if (typeof data === "string") {
				if (data.indexOf("p:") >= 0 || data.indexOf("s:") >= 0 || data.indexOf("d:") >= 0) {
					isDataStringId = true;
				}
			}

			if (messages?.onSuccessMessage) {
				let displayedMessage = messages.onSuccessMessage;
				if (isDataStringId) {
					displayedMessage = `${displayedMessage}: ${data}`;
				}

				commands.executeCommand(
					vsCommands.showInfoMessage,
					namespaces.serverRequests,
					displayedMessage
				);
			}
			return { data, error };
		}

		if (
			error instanceof ConnectError &&
			error.code === gRPCErrors.serverNotRespond &&
			!this.disconnectedErrorDisplayed
		) {
			commands.executeCommand(vsCommands.showErrorMessage, namespaces.connection, error.message);
			commands.executeCommand(vsCommands.disconnect);
			this.disconnectedErrorDisplayed = true;
		}
		return { data, error };
	}
}
