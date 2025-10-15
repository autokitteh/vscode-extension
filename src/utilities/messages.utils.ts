import { commands } from "vscode";

import { vsCommands } from "@constants";
import { LoggerService } from "@services";

export const errorMessageWithLog = async (namespace: string, message: string) => {
	LoggerService.info(namespace, message);
	commands.executeCommand(vsCommands.showErrorMessage, message);
};
