import { namespaces, vsCommands } from "@constants";
import { translate } from "@i18n";
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
		const { data, error } = await requestPromise();

		if (error) {
			let errorMessage = (error as Error).message;
			if (messages?.onFailureMessage) {
				errorMessage = `${translate().t(messages.onFailureMessage)}: ${errorMessage}`;
			}

			commands.executeCommand(
				vsCommands.showErrorMessage,
				namespaces.connection,
				`Error: ${errorMessage}`
			);
			return Promise.resolve({ data: undefined, error: error });
		}
		if (messages?.onSuccessMessage) {
			let successMessage = translate().t(messages.onSuccessMessage);

			if (typeof data === "string") {
				successMessage = translate().t(messages.onSuccessMessage, { data });
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
