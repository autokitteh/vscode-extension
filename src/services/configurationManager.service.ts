import { workspace } from "vscode";

export class ConfigurationManager {
	private updateWorkspaceContext: (key: string, value: any) => Thenable<void>;
	private getWorkspaceContext: <T>(key: string, defaultValue: T) => T;

	constructor(
		updateWorkspaceContext: (key: string, value: any) => Thenable<void>,
		getWorkspaceContext: <T>(key: string, defaultValue: T) => T
	) {
		this.updateWorkspaceContext = updateWorkspaceContext;
		this.getWorkspaceContext = getWorkspaceContext;
	}
	getLSPConfigurations() {
		const starlarkPath = workspace.getConfiguration().get<string>("starlarkLSP.path");
		const starlarkLSPArgs = workspace.getConfiguration().get<string[]>("starlarkLSP.args", []);
		const starlarkLSPVersion = workspace.getConfiguration().get<string>("starlarkLSP.version");
		return { starlarkPath, starlarkLSPArgs, starlarkLSPVersion };
	}
}
