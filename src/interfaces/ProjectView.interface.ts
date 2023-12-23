export interface IProjectViewDelegate {
	onClose?: Callback;
	onBlur?: Callback;
	onFocus?: Callback;
	build: Callback;
	deploy: Callback;
}

export interface IProjectView {
	show(projectName: string): void;
	reveal(): void;
	update(data: any): void;
	dispose(): void;
	delegate?: IProjectViewDelegate;
}
