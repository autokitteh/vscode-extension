import { ConfigurationTarget, workspace } from "vscode";

import { namespaces } from "@constants";
import { LoggerService } from "@services";

export class AppStateHandler {
	static async set(isEnabled: boolean): Promise<void> {
		await workspace.getConfiguration().update("autokitteh.serviceEnabled", isEnabled, ConfigurationTarget.Global);
		LoggerService.info(namespaces.appStateHandler, `App state is ${isEnabled ? "enabled" : "disabled"}`);
	}

	static async get(): Promise<boolean> {
		const appState = (await workspace
			.getConfiguration()
			.get("autokitteh.serviceEnabled", ConfigurationTarget.Global)) as unknown as boolean;

		return appState;
	}
}
