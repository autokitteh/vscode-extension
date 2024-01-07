import { ConfigurationTarget, workspace } from "vscode";

export class AppStateHandler {
	static async updateConnectionStatus(isEnabled: boolean): Promise<void> {
		await workspace
			.getConfiguration()
			.update("autokitteh.serviceEnabled", isEnabled, ConfigurationTarget.Global);
	}

	static async getConnectionStatus(): Promise<boolean> {
		return (await workspace
			.getConfiguration()
			.get("autokitteh.serviceEnabled", ConfigurationTarget.Global)) as unknown as boolean;
	}
}
