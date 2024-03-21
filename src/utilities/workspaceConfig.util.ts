import { ConfigurationTarget, WorkspaceConfiguration, workspace } from "vscode";

export class WorkspaceConfig {
	public static getFromWorkspace<T>(section: string, defaultValue: T): T {
		const configuration: WorkspaceConfiguration = workspace.getConfiguration("autokitteh");
		const value: T | undefined = configuration.get<T>(section);
		return value !== undefined ? value : defaultValue;
	}

	public static setToWorkspace<T>(section: string, value: T): void {
		const configuration: WorkspaceConfiguration = workspace.getConfiguration("autokitteh");
		configuration.update(section, value, ConfigurationTarget.Global);
	}
}
