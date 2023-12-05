import { WebviewViewProvider, WebviewView, Uri, window, Disposable } from "vscode";
import { htmlView } from "./htmlView";
import { messageListener } from "./messageListener";
import { Message } from "../types/message";

export class LeftPanelWebview implements WebviewViewProvider {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	constructor(private readonly extensionPath: Uri, private data: any, private _view: any = null) {}

	private _disposables: Disposable[] = [];

	resolveWebviewView(webviewView: WebviewView): void | Thenable<void> {
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this.extensionPath],
		};
		webviewView.webview.html = htmlView(webviewView.webview, this.extensionPath);
		this._view = webviewView;
		this.activateMessageListener();
	}

	private activateMessageListener() {
		this._view.webview.onDidReceiveMessage(messageListener, undefined, this._disposables);
	}

	public postMessageToWebview<T extends Message = Message>(message: T) {
		// post message from extension to webview
		this._view.webview.postMessage(message);
	}
}
