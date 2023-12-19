type Callback = () => void;

type ProjectDelegate = {
	onClose?: Callback;
	build: Callback;
	deploy: Callback;
};

interface IProjectView {
	show(): void;
	update(data: any): void;
	delegate?: ProjectDelegate;
}
