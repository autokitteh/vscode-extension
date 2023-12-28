import { vsCommands } from "@constants";
import { ConnectionHandler } from "@controllers/utilities/connectionHandler";
import { errorHelper } from "@controllers/utilities/errorHelper";
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
		}
		if (error && data) {
			errorHelper(error, messages?.onFailureMessage);
			return data as T;
		}
		errorHelper(error, messages?.onFailureMessage);

		return;
	}
}
