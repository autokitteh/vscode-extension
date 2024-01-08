import { namespaces } from "@constants";
import { LoggerService } from "@services";
import { ConfigurationTarget, workspace } from "vscode";

export class AppStateHandler {
	static async set(isEnabled: boolean): Promise<void> {
		await workspace
			.getConfiguration()
			.update("autokitteh.serviceEnabled", isEnabled, ConfigurationTarget.Global);
	}

	static async get(): Promise<boolean> {
		const appState = (await workspace
			.getConfiguration()
			.get("autokitteh.serviceEnabled", ConfigurationTarget.Global)) as unknown as boolean;
		LoggerService.log(
			namespaces.appStateHandler,
			`App state is ${appState ? "enabled" : "disabled"}`
		);

		return appState;
	}
}
