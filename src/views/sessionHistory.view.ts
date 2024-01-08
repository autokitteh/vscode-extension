import { MessageType, Theme } from "@enums";
import { translate } from "@i18n/translation.i18n";
import { ISessionView, ISessionViewDelegate } from "@interfaces/sessionView.interface";
import { getNonce } from "@utilities";
import { getUri } from "@utilities/getUri.utils";
import * as vscode from "vscode";
import { Uri } from "vscode";

export class SessionView implements ISessionView {
	private panel?: vscode.WebviewPanel;
	public delegate?: ISessionViewDelegate;

	constructor(private context: vscode.ExtensionContext) {}

	public update(data: any): void {
		this.panel?.webview.postMessage(data);
	}
	public reveal(projectName: string): void {
		this.panel?.reveal();
		this.panel?.webview.postMessage?.({
			type: MessageType.setProjectName,
			payload: projectName,
		});
	}

	public onBlur() {
		this.delegate?.onBlur?.();
	}

	public onFocus() {
		this.delegate?.onFocus?.();
	}

	public dispose() {
		this.delegate?.onFocus?.();
	}

	public show(sessionLogs: Array<string>) {
		this.panel = vscode.window.createWebviewPanel(
			"sessionLog",
			`${translate().t("general.companyName")}`,
			vscode.ViewColumn.Two,
			{
				enableScripts: true,
				localResourceRoots: [
					Uri.joinPath(this.context.extensionUri, "dist"),
					Uri.joinPath(this.context.extensionUri, "webview-ui/build"),
					Uri.joinPath(this.context.extensionUri, "node_modules/@vscode/codicons/dist"),
				],
			}
		);

		this.panel.onDidChangeViewState((newState) => {
			if (newState.webviewPanel.visible) {
				this.onFocus();
			} else {
				this.onBlur();
			}
		});

		this.panel.onDidDispose(() => {
			this.delegate?.onClose?.();
		});

		this.panel.webview.html = this.getWebviewContent();

		this.panel.webview.postMessage?.({
			type: MessageType.setSessionLogs,
			payload: sessionLogs,
		});
	}

	private getWebviewContent(): string {
		if (this.panel) {
			const stylesUri = getUri(this.panel.webview, this.context.extensionUri, [
				"webview-ui",
				"build",
				"assets",
				"index.css",
			]);
			const scriptUri = getUri(this.panel.webview, this.context.extensionUri, [
				"webview-ui",
				"build",
				"assets",
				"index.js",
			]);
			const codiconsUri = getUri(this.panel.webview, this.context.extensionUri, [
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
			  <meta
				http-equiv="Content-Security-Policy"
				content="default-src 'none'; font-src ${this.panel.webview.cspSource}; 
				style-src vscode-resource: 'self' 'unsafe-inline';
				script-src 'nonce-${nonce}';">
							  
			  <link rel="stylesheet" type="text/css" href="${stylesUri}">
			  <link rel="stylesheet" type="text/css" href="${codiconsUri}">
			  <title>${translate().t("general.companyName")}</title>
			</head>
			<body>
			  <div id="root"></div>
			  <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
			</body>
		  </html>`;
		}
		return "";
	}
}
