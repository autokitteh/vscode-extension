import { StartSessionArgsType } from "@type";
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
	deactivateDeployment?: Callback<string>;
	startSession?: Callback<StartSessionArgsType>;
	deleteDeployment?: Callback<string>;
	deleteSession?: Callback<string>;
	displayErrorWithoutActionButton?: Callback<string>;
	stopSession?: Callback<string>;
	copyProjectPath?: Callback<string>;
	openProjectResourcesDirectory?: Callback<string>;
	deleteProject?: Callback;
	setProjectResourcesDirectory?: Callback<string>;
}

export interface IProjectView {
	show(projectName: string): void;
	reveal(projectName: string): void;
	update(data: any): void;
	dispose(): void;
	delegate?: IProjectViewDelegate;
}
