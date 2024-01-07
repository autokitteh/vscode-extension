import { nameSpaces, vsCommands } from "@constants";
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
		return { data, error };
	}
}
