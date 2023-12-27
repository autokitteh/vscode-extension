import { vsCommands } from "@constants";
import { ConnectionHandler } from "@controllers/utilities/connectionHandler";
import { errorHelper } from "@controllers/utilities/errorHelper";
import { translate } from "@i18n";
import { TranslationKeys } from "@type/i18next";
import { ServiceResponse } from "@type/services.types";
import { commands } from "vscode";

export class RequestHandler {
	static async handleServiceResponse<T>(
		requestPromise: () => Promise<ServiceResponse<T>>,
		messages?: {
			onSuccessTranslationKey?: TranslationKeys;
			onFailTranslationKey?: TranslationKeys;
		}
	): Promise<T | undefined> {
		if (!ConnectionHandler.isConnected) {
			return;
		}
		const { error, data } = await requestPromise();
		errorHelper("error");
		if (!error) {
			if (messages?.onSuccessTranslationKey) {
				commands.executeCommand(
					vsCommands.showInfoMessage,
					translate().t(messages.onSuccessTranslationKey)
				);
			}
			return data as T;
		}
		if (error && data) {
			errorHelper(error, messages?.onFailTranslationKey);
			return data as T;
		}
		errorHelper(error, messages?.onFailTranslationKey);

		return;
	}
}
