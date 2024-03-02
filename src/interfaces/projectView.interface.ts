import { ExecutionParams } from "@type";
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
	setSessionExecutionInputs?: Callback<string>;
	deactivateDeployment?: Callback<string>;
	runExecution?: Callback<string>;
	saveExecutionProps?: Callback<ExecutionParams>;
}

export interface IProjectView {
	show(projectName: string): void;
	reveal(projectName: string): void;
	update(data: any): void;
	dispose(): void;
	delegate?: IProjectViewDelegate;
}
