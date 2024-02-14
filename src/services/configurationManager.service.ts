import { ConfigurationTarget, workspace, WorkspaceConfiguration } from "vscode";

export class ConfigurationManagerService {
	private updateWorkspaceContext: (key: string, value: any) => Thenable<void>;
	private getFromWorkspaceContext: <T>(key: string, defaultValue: T) => T;
	private extensionPath: string;

	constructor(
		updateWorkspaceContext: (key: string, value: any) => Thenable<void>,
		getWorkspaceContext: <T>(key: string, defaultValue: T) => T,
		extensionPath: string
	) {
		this.updateWorkspaceContext = updateWorkspaceContext;
		this.getFromWorkspaceContext = getWorkspaceContext;
		this.extensionPath = extensionPath;
	}

	public getFromWorkspace<T>(section: string, defaultValue: T): T {
		const configuration: WorkspaceConfiguration = workspace.getConfiguration("autokitteh", null);
		const value: T | undefined = <T>configuration[section];
		return value !== undefined ? value : defaultValue;
	}

	public setToWorkspace<T>(section: string, value: T): void {
		const configuration: WorkspaceConfiguration = workspace.getConfiguration();
		configuration.update(section, value, ConfigurationTarget.Global);
		configuration.update(section, value);
		return;
	}

	public getWorkspaceContext<T>(key: string, defaultValue: T): T {
		return this.getWorkspaceContext(key, defaultValue);
	}

	public setToWorkspaceContext<T>(key: string, value: T): void {
		this.updateWorkspaceContext(key, value);
	}

	public getLSPConfigurations() {
		const starlarkPath = this.getFromWorkspace<string>("starlarkLSP", "");
		const starlarkLSPArgs = this.getFromWorkspace<string[]>("starlarkLSP.args", ["start"]);
		const starlarkLSPVersion = this.getFromWorkspaceContext<string>("autokitteh.starlarkVersion", "");
		return { starlarkPath, starlarkLSPArgs, starlarkLSPVersion, extensionPath: this.extensionPath };
	}

	public getExtensionPath() {
		return this.extensionPath;
	}
}
