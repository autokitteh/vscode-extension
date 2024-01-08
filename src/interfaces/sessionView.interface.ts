import { Callback } from "@type/interfaces";

export interface ISessionViewDelegate {
	onClose?: Callback;
	onBlur?: Callback;
	onFocus?: Callback;
}

export interface ISessionView {
	show(sessionLogs: Array<string>): void;
	reveal(projectName: string): void;
	update(data: any): void;
	dispose(): void;
	delegate?: ISessionViewDelegate;
}
