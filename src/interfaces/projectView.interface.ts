export interface IProjectViewDelegate {
	onClose?: Callback;
	onBlur?: Callback;
	onFocus?: Callback;
	selectDeployment?: CallbackWStringIdParam;
	build: Callback;
	run: Callback;
}

export interface IProjectView {
	show(projectName: string): void;
	reveal(): void;
	update(data: any): void;
	dispose(): void;
	delegate?: IProjectViewDelegate;
}
