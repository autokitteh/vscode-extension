import { Callback } from "@type/interfaces";

export interface IProjectViewDelegate {
	onClose?: Callback;
	onBlur?: Callback;
	onFocus?: Callback;
	build: Callback;
	fetchResources: Callback;
	run: Callback;
	selectDeployment?: Callback<string>;
	displaySessionLogs?: Callback<string>;
	activateDeployment?: Callback<string>;
	deactivateDeployment?: Callback<string>;
}

export interface IProjectView {
	show(projectName: string): void;
	reveal(projectName: string): void;
	update(data: any): void;
	dispose(): void;
	delegate?: IProjectViewDelegate;
}
