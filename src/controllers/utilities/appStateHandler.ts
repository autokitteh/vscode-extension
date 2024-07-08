import { commands } from "vscode";

import { namespaces, vsCommands } from "@constants";
import { LoggerService } from "@services";

export class AppStateHandler {
	static async set(isEnabled: boolean): Promise<void> {
		await commands.executeCommand(vsCommands.setContext, "serviceEnabled", isEnabled);
		LoggerService.info(namespaces.appStateHandler, `App state is ${isEnabled ? "enabled" : "disabled"}`);
	}

	static async get(): Promise<boolean> {
		const appState = (await commands.executeCommand(vsCommands.getContext, "serviceEnabled")) as unknown as boolean;

		return appState;
	}
}
