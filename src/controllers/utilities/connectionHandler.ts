import { ConnectError } from "@connectrpc/connect";
import { BASE_URL, vsCommands } from "@constants";
import { gRPCErrors } from "@constants/api.constants";
import { ResponseHandler } from "@controllers/utilities/responseHandler";
import { translate } from "@i18n";
import { AuthorizationService } from "@services";
import { ValidateURL } from "@utilities";
import { MessageHandler } from "@views";
import { ConfigurationTarget, commands, workspace } from "vscode";

export class ConnectionHandler {
	static connect = async (): Promise<boolean> => {
		if (!ValidateURL(BASE_URL)) {
			MessageHandler.errorMessage(translate().t("errors.badHostURL"));
			commands.executeCommand(vsCommands.disconnect);
			return false;
		}

		try {
			await AuthorizationService.whoAmI();
			await ConnectionHandler.updateConnectionStatus(true);
			return true;
		} catch (error: unknown) {
			if (error instanceof ConnectError) {
				MessageHandler.errorMessage(translate().t("errors.serverNotRespond"));
				if (error.code === gRPCErrors.serverNotRespond) {
					commands.executeCommand(vsCommands.disconnect);
				}
			} else if (error instanceof Error) {
				MessageHandler.errorMessage(error.message);
			} else {
				MessageHandler.errorMessage(error as string);
			}
			return false;
		}
	};

	static async updateConnectionStatus(isEnabled: boolean) {
		await workspace
			.getConfiguration()
			.update("autokitteh.serviceEnabled", isEnabled, ConfigurationTarget.Global);
	}

	static async getConnectionStatus() {
		return (await workspace.getConfiguration().get("autokitteh.serviceEnabled")) as boolean;
	}
}
