import {
	WebviewViewProvider,
	WebviewView,
	Webview,
	Uri,
	EventEmitter,
	window,
	Disposable,
} from "vscode";
import { getNonce } from "../utilities/getNonce";
import { projectService } from "../services";

import { getUri } from "../utilities/getUri";

export class LeftPanelWebview implements WebviewViewProvider {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	constructor(private readonly extensionPath: Uri, private data: any, private _view: any = null) {}
	private onDidChangeTreeData: EventEmitter<any | undefined | null | void> = new EventEmitter<
		any | undefined | null | void
	>();
	private _disposables: Disposable[] = [];

	refresh(context: any): void {
		this.onDidChangeTreeData.fire(null);
		this._view.webview.html = this._getHtmlForWebview(this._view?.webview, this.extensionPath);
	}

	//called when a view first becomes visible
	resolveWebviewView(webviewView: WebviewView): void | Thenable<void> {
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this.extensionPath],
		};
		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview, this.extensionPath);
		this._view = webviewView;
		this.activateMessageListener();
	}

	private activateMessageListener() {
		this._view.webview.onDidReceiveMessage(
			async (message: any) => {
				const command = message.command;
				const text = message.text;

				switch (command) {
					case "hello":
						const res = await projectService.list("u:130f562491dc11eea44612584eb0c4b9");
						console.log(res);
						window.showInformationMessage(text);
						return;
					// Add more switch case statements here as more webview message commands
					// are created within the webview context (i.e. inside media/main.js)
				}
			},
			undefined,
			this._disposables
		);
	}

	private _getHtmlForWebview(webview: Webview, extensionUri: Uri) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		// Script to handle user action
		// The CSS file from the React build output
		const stylesUri = getUri(webview, extensionUri, ["webview-ui", "build", "assets", "index.css"]);
		// The JS file from the React build output
		const scriptUri = getUri(webview, extensionUri, ["webview-ui", "build", "assets", "index.js"]);
		const codiconsUri = getUri(webview, extensionUri, [
			"webview-ui",
			"node_modules",
			"@vscode",
			"codicons",
			"dist",
			"codicon.css",
		]);

		const nonce = getNonce();

		// Tip: Install the es6-string-html VS Code extension to enable code highlighting below
		return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
		  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <link rel="stylesheet" type="text/css" href="${codiconsUri}">
          <title>Hello World</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>`;
	}
}
