import { namespaces, vsCommands } from "@constants";
import { translate } from "@i18n";
import { ServiceResponse } from "@type/services.types";
import { commands } from "vscode";

export class RequestHandler {
	static async handleServiceResponse<T>(
		requestPromise: () => Promise<ServiceResponse<T>>,
		messages?: {
			onSuccessMessageKey?: string;
			onFailureMessageKey?: string;
		}
	): Promise<{ data: T | undefined; error: unknown }> {
		const { data, error } = await requestPromise();

		if (error) {
			let errorMessage = (error as Error).message;
			if (messages?.onFailureMessageKey) {
				errorMessage = `${translate().t(messages.onFailureMessageKey)}: ${errorMessage}`;
			}

			commands.executeCommand(
				vsCommands.showErrorMessage,
				namespaces.connection,
				`Error: ${errorMessage}`
			);
			return Promise.resolve({ data: undefined, error: error });
		}
		if (messages?.onSuccessMessageKey) {
			let successMessage = translate().t(messages.onSuccessMessageKey);

			if (typeof data === "string") {
				successMessage = translate().t(messages.onSuccessMessageKey, { id: data });
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
