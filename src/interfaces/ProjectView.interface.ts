interface IProjectViewDelegate {
	onClose?: Callback;
	onUnFocus?: Callback;
	build: Callback;
	deploy: Callback;
}

interface IProjectView {
	show(projectName: string): void;
	reveal(): void;
	update(data: any): void;
	dispose(): void;
	delegate?: IProjectViewDelegate;
}
