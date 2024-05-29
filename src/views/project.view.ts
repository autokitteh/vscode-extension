import { MessageType, Theme } from "@enums";
import { translate } from "@i18n/translation.i18n";
import { IProjectView, IProjectViewDelegate } from "@interfaces";
import { StartSessionArgsType, Message } from "@type";
import { getNonce } from "@utilities";
import { getUri } from "@utilities/getUri.utils";
import * as vscode from "vscode";
import { Uri, window } from "vscode";

export class ProjectView implements IProjectView {
	private panel?: vscode.WebviewPanel;
	public delegate?: IProjectViewDelegate;

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

	public setupWebviewMessageListener() {
		this.panel?.webview.onDidReceiveMessage(
			(message: Message) => {
				switch (message.type) {
					case MessageType.buildProject:
						this.delegate?.build?.();
						break;
					case MessageType.runProject:
						this.delegate?.run?.();
						break;
					case MessageType.selectDeployment:
						this.delegate?.selectDeployment?.(message.payload as string);
						break;
					case MessageType.displaySessionLogsAndStop:
						this.delegate?.displaySessionLogsAndStop?.(message.payload as string);
						break;
					case MessageType.activateDeployment:
						this.delegate?.activateDeployment?.(message.payload as string);
						break;
					case MessageType.deactivateDeployment:
						this.delegate?.deactivateDeployment?.(message.payload as string);
						break;
					case MessageType.onClickSetResourcesDirectory:
						this.delegate?.onClickSetResourcesDirectory?.();
					case MessageType.startSession:
						this.delegate?.startSession?.(message.payload as StartSessionArgsType);
						break;
					case MessageType.deleteDeployment:
						this.delegate?.deleteDeployment?.(message.payload as string);
						break;
					case MessageType.deleteSession:
						this.delegate?.deleteSession?.(message.payload as string);
						break;
					case MessageType.displayErrorWithoutActionButton:
						this.delegate?.displayErrorWithoutActionButton?.(message.payload as string);
						break;
					case MessageType.stopSession:
						this.delegate?.stopSession?.(message.payload as string);
						break;
					case MessageType.copyProjectPath:
						this.delegate?.copyProjectPath?.(message.payload as string);
						break;
					case MessageType.openProjectResourcesDirectory:
						this.delegate?.openProjectResourcesDirectory?.(message.payload as string);
						break;
					case MessageType.setProjectResourcesDirectory:
						this.delegate?.setProjectResourcesDirectory?.(message.payload as string);
						break;
					case MessageType.deleteProject:
						this.delegate?.deleteProject?.();
						break;
					case MessageType.setSessionsStateFilter:
						this.delegate?.setSessionsStateFilter?.(message.payload as string);
						break;
					case MessageType.loadInitialDataOnceViewReady:
						this.delegate?.loadInitialDataOnceViewReady?.();
						break;
					case MessageType.loadMoreSessions:
						this.delegate?.loadMoreSessions?.();
						break;
					case MessageType.toggleSessionsLiveTail:
						this.delegate?.toggleSessionsLiveTail?.(message.payload as boolean);
						break;
					case MessageType.tryToReconnect:
						this.delegate?.tryToReenable?.();
					case MessageType.openConnectionInitURL:
						this.delegate?.openConnectionInitURL?.(message.payload as { connectionId: string; initURL: string });
						break;
					case MessageType.openConnectionTestURL:
						this.delegate?.openConnectionTestURL?.(message.payload as string);
						break;
					default:
				}
			},
			undefined,
			this.context.subscriptions
		);
	}

	public onBlur() {
		this.delegate?.onBlur?.();
	}

	public onFocus() {
		this.setThemeByEditor();
		this.delegate?.onFocus?.();
	}

	public dispose() {
		this.delegate?.onFocus?.();
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
					Uri.joinPath(this.context.extensionUri, "vscode-react/build"),
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
		this.setupWebviewMessageListener();

		this.panel.webview.html = this.getWebviewContent();

		const themeKind = window.activeColorTheme.kind as number as Theme;
		this.changeTheme(themeKind);
		this.addThemeListener();
		this.setThemeByEditor();
	}

	setThemeByEditor = () => {
		const themeKind = window.activeColorTheme.kind as number as Theme;
		this.changeTheme(themeKind);
		this.addThemeListener();
	};

	private changeTheme(themeKind: Theme) {
		this.panel?.webview.postMessage?.({
			type: MessageType.setTheme,
			payload: themeKind,
		});
	}

	private addThemeListener() {
		return window.onDidChangeActiveColorTheme((editor) => {
			if (editor) {
				const themeKind = (editor.kind || window.activeColorTheme.kind) as number as Theme;
				this.changeTheme(themeKind);
			}
		});
	}

	private getWebviewContent(): string {
		if (this.panel) {
			const stylesUri = getUri(this.panel.webview, this.context.extensionUri, [
				"vscode-react",
				"build",
				"assets",
				"index.css",
			]);
			const scriptUri = getUri(this.panel.webview, this.context.extensionUri, [
				"vscode-react",
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
				content="default-src 'none'; 
				font-src ${this.panel.webview.cspSource} 'self' https://*.vscode-cdn.net https://cdn.jsdelivr.net; 
				style-src vscode-resource: 'self'  https://cdn.jsdelivr.net 'unsafe-inline';
				script-src-elem vscode-resource: 'self' https://cdn.jsdelivr.net 'unsafe-inline';
				worker-src 'self' blob:;
				img-src 'self' data:;
				script-src 'self' https://cdn.jsdelivr.net https://*.vscode-cdn.net;">

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
