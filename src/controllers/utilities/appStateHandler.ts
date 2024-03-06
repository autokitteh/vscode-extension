import { ConfigurationTarget, workspace } from "vscode";

export class AppStateHandler {
	static async set(isEnabled: boolean): Promise<void> {
		await workspace.getConfiguration().update("autokitteh.serviceEnabled", isEnabled, ConfigurationTarget.Global);
	}

	static async get(): Promise<boolean> {
		const appState = (await workspace
			.getConfiguration()
			.get("autokitteh.serviceEnabled", ConfigurationTarget.Global)) as unknown as boolean;

		return appState;
	}
}
