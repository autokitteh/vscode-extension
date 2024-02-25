import { Callback } from "@type/interfaces";

export interface IProjectViewDelegate {
	onClose?: Callback;
	onBlur?: Callback;
	onFocus?: Callback;
	build: Callback;
	onClickSetResourcesDirectory: Callback;
	run: Callback;
	selectDeployment?: Callback<string>;
	displaySessionLogs?: Callback<string>;
	activateDeployment?: Callback<string>;
	copyToClipboard?: Callback<string>;
	deactivateDeployment?: Callback<string>;
	runSingleShot?: Callback;
}

export interface IProjectView {
	show(projectName: string): void;
	reveal(projectName: string): void;
	update(data: any): void;
	dispose(): void;
	delegate?: IProjectViewDelegate;
}
