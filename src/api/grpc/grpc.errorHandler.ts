import { ConnectError } from "@connectrpc/connect";
import { vsCommands } from "@constants";
import { translate } from "@i18n";
import { AuthorizationService } from "@services";
import { MessageHandler } from "@views";
import { commands } from "vscode";

export const handlegRPCErrors = async (error: any) => {
	if (error instanceof ConnectError) {
		const errorMessage = `Error code: ${error.code}, error message: ${error.message}`;
		console.error(errorMessage);
		MessageHandler.errorMessage(errorMessage);
	} else {
		const errorMessage = `Error occured: ${error}`;
		console.error(errorMessage);
		MessageHandler.errorMessage(errorMessage);
	}

	const user = await AuthorizationService.whoAmI();
	if (!user) {
		MessageHandler.errorMessage(translate().t("errors.noHostConnection"));
		commands.executeCommand(vsCommands.disconnect);
	}
};
