import { nameSpaces, vsCommands } from "@constants";
import { ConnectionHandler } from "@controllers/utilities/connectionHandler";
import { errorHelper } from "@controllers/utilities/errorHelper";
import { translate } from "@i18n";
import { LoggerService } from "@services";
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
		errorHelper(nameSpaces.serverRequests, error, messages?.onFailureMessage);
		return { data, error };
	}
}
