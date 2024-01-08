import { Callback, CallbackWStringIdParam, SectionRowsRangeCB } from "@type/interfaces";

export interface IProjectViewDelegate {
	onClose?: Callback;
	onBlur?: Callback;
	onFocus?: Callback;
	build: Callback;
	run: Callback;
	setRowsRangePerSection: SectionRowsRangeCB;
	selectDeployment?: CallbackWStringIdParam;
	displaySessionStats?: CallbackWStringIdParam;
}

export interface IProjectView {
	show(projectName: string): void;
	reveal(projectName: string): void;
	update(data: any): void;
	dispose(): void;
	delegate?: IProjectViewDelegate;
}
