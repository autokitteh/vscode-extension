import { workspace, WorkspaceConfiguration } from "vscode";

export const getConfig = <T>(section: string, defaultValue: T): T => {
	const configuration: WorkspaceConfiguration = workspace.getConfiguration();
	const value: T | undefined = configuration.get<T>(section, defaultValue);
	return value !== undefined ? value : defaultValue;
};
