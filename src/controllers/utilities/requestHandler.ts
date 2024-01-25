import { namespaces, vsCommands } from "@constants";
import { ServiceResponse } from "@type/services.types";
import { commands } from "vscode";

export class RequestHandler {
	static async handleServiceResponse<T>(
		requestPromise: () => Promise<ServiceResponse<T>>,
		messages?: {
			formatSuccessMessage?: (data?: any) => string;
			formatFailureMessage?: (data?: any) => string;
		}
	): Promise<{ data: T | undefined; error: unknown }> {
		const { data, error } = await requestPromise();

		if (error) {
			let errorMessage = (error as Error).message;
			if (messages?.formatFailureMessage) {
				errorMessage = messages.formatFailureMessage(errorMessage);
			}

			commands.executeCommand(
				vsCommands.showErrorMessage,
				namespaces.connection,
				`Error: ${errorMessage}`
			);
			return Promise.resolve({ data: undefined, error: error });
		}
		if (messages?.formatSuccessMessage) {
			let successMessage = messages?.formatSuccessMessage();

			if (typeof data === "string") {
				successMessage = messages.formatSuccessMessage(data);
			}

			commands.executeCommand(
				vsCommands.showInfoMessage,
				namespaces.serverRequests,
				successMessage
			);
		}

		return Promise.resolve({ data: data, error: undefined });
	}
}
