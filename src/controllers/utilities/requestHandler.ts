import { ConnectError } from "@connectrpc/connect";
import { nameSpaces, vsCommands } from "@constants";
import { gRPCErrors } from "@constants/api.constants";
import { ServiceResponse } from "@type/services.types";
import { commands } from "vscode";

export class RequestHandler {
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
					nameSpaces.serverRequests,
					messages.onSuccessMessage
				);
			}
			return { data, error };
		}

		if (error instanceof ConnectError) {
			if (error.code === gRPCErrors.serverNotRespond) {
				commands.executeCommand(vsCommands.showErrorMessage, nameSpaces.connection, error.message);
				commands.executeCommand(vsCommands.disconnect);
			}
		}
		return { data, error };
	}
}
