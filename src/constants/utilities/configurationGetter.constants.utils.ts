import { workspace, WorkspaceConfiguration } from "vscode";

// Function to get configuration with a default value and explicit return type
export const getConfig = <T>(section: string, defaultValue: T): T => {
	const configuration: WorkspaceConfiguration = workspace.getConfiguration();
	const value: T | undefined = configuration.get<T>(section, defaultValue);
	return value !== undefined ? value : defaultValue;
};
