interface IProjectViewDelegate {
	onClose?: Callback;
	build: Callback;
	deploy: Callback;
}

interface IProjectView {
	show(): void;
	reveal(): void;
	update(data: any): void;
	dispose(): void;
	delegate?: IProjectViewDelegate;
}
