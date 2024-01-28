import { namespaces, vsCommands } from "@constants";
import { ServiceResponse } from "@type/services.types";
import { commands } from "vscode";

export class RequestHandler {
	static async handleServiceResponse<T>(
		requestPromise: () => Promise<ServiceResponse<T>>,
		messages?: {
			formatSuccessMessage?: (data?: T | string) => string;
			formatFailureMessage?: (data?: string | unknown) => string;
		}
	): Promise<{ data: T | undefined; error: unknown }> {
		const { data, error } = await requestPromise();

		if (error) {
			const errorMessage = messages?.formatFailureMessage?.(error);

			commands.executeCommand(vsCommands.showErrorMessage, namespaces.connection, errorMessage);
			return { data: undefined, error };
		}

		const successMessage = messages?.formatSuccessMessage?.(data);
		if (successMessage) {
			commands.executeCommand(
				vsCommands.showInfoMessage,
				namespaces.serverRequests,
				successMessage
			);
		}

		return { data, error: undefined };
	}
}
