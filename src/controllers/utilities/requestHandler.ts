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
			if (messages?.onSuccessMessage) {
				commands.executeCommand(
					vsCommands.showInfoMessage,
					namespaces.serverRequests,
					messages.onSuccessMessage
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