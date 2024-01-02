import { Callback, CallbackWStringIdParam, PageSizeCB } from "@type/interfaces";

export interface IProjectViewDelegate {
	onClose?: Callback;
	onBlur?: Callback;
	onFocus?: Callback;
	build: Callback;
	run: Callback;
	setDeploymentsPageSize: PageSizeCB;
	selectDeployment?: CallbackWStringIdParam;
	setSessionsPageSize: PageSizeCB;
}

export interface IProjectView {
	show(projectName: string): void;
	reveal(projectName: string): void;
	update(data: any): void;
	dispose(): void;
	delegate?: IProjectViewDelegate;
}
