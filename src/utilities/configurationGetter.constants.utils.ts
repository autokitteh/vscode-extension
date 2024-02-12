import { ConfigurationTarget, workspace, WorkspaceConfiguration } from "vscode";

export const getConfig = <T>(section: string, defaultValue: T): T => {
	const configuration: WorkspaceConfiguration = workspace.getConfiguration();
	const value: T | undefined = configuration.get<T>(section, defaultValue);
	return value !== undefined ? value : defaultValue;
};
export const setConfig = <T>(section: string, defaultValue: T): void => {
	const configuration: WorkspaceConfiguration = workspace.getConfiguration();
	configuration.update(section, defaultValue, ConfigurationTarget.Global);
	return;
};
export const setConfigWorkspace = <T>(section: string, defaultValue: T): void => {
	const configuration: WorkspaceConfiguration = workspace.getConfiguration();
	configuration.update(section, defaultValue);
	return;
};
