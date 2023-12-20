import { translate } from "@i18n/translation";
import { Message, MessageType } from "@type";
import { getNonce } from "@utilities";
import { getUri } from "@utilities/getUri";
import * as vscode from "vscode";
import { Uri, window } from "vscode";

export class ProjectView implements IProjectView {
	private panel?: vscode.WebviewPanel;
	public delegate?: IProjectViewDelegate;

	constructor(private context: vscode.ExtensionContext) {}

	public update(data: any): void {
		if (this.panel && this.panel.webview) {
			this.panel.webview.postMessage(data);
		}
	}
	public reveal(): void {
		if (this.panel) {
			this.panel.reveal();
		}
	}

	public setupWebviewMessageListener() {
		if (this.panel) {
			this.panel.webview.onDidReceiveMessage(
				(message: Message) => {
					switch (message.type) {
						case MessageType.deployProject:
							console.log("deploy");
							// TODO: Relevant function in the controller, under the delegate
							break;
					}
				},
				undefined,
				this.context.subscriptions
			);
		}
	}

	public onClose() {
		if (this.panel) {
			this.panel.onDidDispose(() => {
				if (this.delegate?.onClose) {
					this.delegate.onClose();
				}
			});
		}
	}

	public onBlur() {
		if (this.delegate?.onBlur) {
			this.delegate.onBlur();
		}
	}

	public onFocus() {
		if (this.delegate?.onFocus) {
			this.delegate.onFocus();
		}
	}

	public dispose() {
		if (this.panel) {
			this.panel.dispose();
		}
	}

	public show(projectName: string) {
		this.panel = vscode.window.createWebviewPanel(
			"project",
			`${translate().t("general.companyName")}: ${projectName}`,
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [
					Uri.joinPath(this.context.extensionUri, "dist"),
					Uri.joinPath(this.context.extensionUri, "webview-ui/build"),
					Uri.joinPath(this.context.extensionUri, "webview-ui/node_modules/@vscode/codicons/dist"),
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

		this.setupWebviewMessageListener();
		this.onClose();

		this.panel.webview.html = this.getWebviewContent();
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
			  <meta
				http-equiv="Content-Security-Policy"
				content="default-src 'none'; font-src ${this.panel.webview.cspSource}; 
				style-src ${this.panel.webview.cspSource}; script-src 'nonce-${nonce}';">
			  
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
