import { WorkspaceConfig } from "@utilities";

export class ExtensionContextService {
	private updateContext: (key: string, value: any) => Thenable<void>;
	private getContext: <T>(key: string, defaultValue: T) => T;
	private extensionPath: string;

	constructor(
		updateContext: (key: string, value: any) => Thenable<void>,
		getContext: <T>(key: string, defaultValue: T) => T,
		extensionPath: string
	) {
		this.updateContext = updateContext;
		this.getContext = getContext;
		this.extensionPath = extensionPath;
	}

	public setToContext<T>(key: string, value: T): void {
		this.updateContext(key, value);
	}

	public getFromContext<T>(key: string, defaultValue: T): T {
		return this.getContext(key, defaultValue);
	}

	public getLSPConfigurations(): {
		starlarkPath: string;
		starlarkLSPVersion: string;
		extensionPath: string;
	} {
		const starlarkPath =
			WorkspaceConfig.getFromWorkspace<string>("starlarkLSP", "") ||
			this.getFromContext<string>("autokitteh.starlarkLSP", "");
		const starlarkLSPVersion = this.getFromContext<string>("autokitteh.starlarkVersion", "");

		return { starlarkPath, starlarkLSPVersion, extensionPath: this.extensionPath };
	}

	public getExtensionPath(): string | undefined {
		return this.extensionPath;
	}
}
