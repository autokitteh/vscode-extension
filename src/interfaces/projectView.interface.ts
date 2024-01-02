import { Callback, CallbackWStringIdParam, PageSizeCB } from "@type/interfaces";

export interface IProjectViewDelegate {
	onClose?: Callback;
	onBlur?: Callback;
	onFocus?: Callback;
	build: Callback;
	run: Callback;
	setPageSize: PageSizeCB;
	selectDeployment?: CallbackWStringIdParam;
}

export interface IProjectView {
	show(projectName: string): void;
	reveal(projectName: string): void;
	update(data: any): void;
	dispose(): void;
	delegate?: IProjectViewDelegate;
}
