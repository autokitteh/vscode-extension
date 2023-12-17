import { Message } from "@type/message";
import { htmlView } from "@views/utils/htmlView";
import { messageListener } from "@views/utils/messageListener";
import { Disposable, Uri, ViewColumn, Webview, WebviewPanel, window } from "vscode";

/**
 * This class manages the state and behavior of ProjectWebview webview panels.
 *
 * It contains all the data and methods for:
 *
 * - Creating and rendering ProjectWebview webview panels
 * - Properly cleaning up and disposing of webview resources when the panel is closed
 * - Setting the HTML (and by proxy CSS/JavaScript) content of the webview panel
 * - Setting message listeners so data can be passed between the webview and extension
 */
export class ProjectWebview {
	public static currentPanel: ProjectWebview | undefined;
	private readonly _panel: WebviewPanel;
	private _disposables: Disposable[] = [];

	/**
	 * The ProjectWebview class private constructor (called only from the render method).
	 *
	 * @param panel A reference to the webview panel
	 * @param extensionUri The URI of the directory containing the extension
	 */
	public constructor(panel: WebviewPanel, extensionUri: Uri) {
		this._panel = panel;

		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
		this._panel.webview.html = htmlView(this._panel.webview, extensionUri);
		this._setWebviewMessageListener(this._panel.webview);
	}

	/**
	 * Renders the current webview panel if it exists otherwise a new webview panel
	 * will be created and displayed.
	 *
	 * @param extensionUri The URI of the directory containing the extension.
	 */
	public static render(webviewTitle: string, extensionUri: Uri) {
		if (ProjectWebview.currentPanel) {
			ProjectWebview.currentPanel.dispose();
		}
		const panel = window.createWebviewPanel("autokittehShowProject", webviewTitle, ViewColumn.One, {
			enableScripts: true,
			localResourceRoots: [
				Uri.joinPath(extensionUri, "dist"),
				Uri.joinPath(extensionUri, "webview-ui/build"),
				Uri.joinPath(extensionUri, "webview-ui/node_modules/@vscode/codicons/dist"),
			],
		});

		ProjectWebview.currentPanel = new ProjectWebview(panel, extensionUri);
		return ProjectWebview;
	}

	/**
	 * Cleans up and disposes of webview resources when the webview panel is closed.
	 */
	public dispose() {
		this._panel.dispose();

		while (this._disposables.length) {
			const disposable = this._disposables.pop();
			if (disposable) {
				disposable.dispose();
			}
		}
	}

	/**
	 * Sets up an event listener to listen for messages passed from the webview context and
	 * executes code based on the message that is recieved.
	 *
	 * @param webview A reference to the extension webview
	 * @param context A reference to the extension context
	 */
	private async _setWebviewMessageListener(webview: Webview) {
		webview.onDidReceiveMessage(messageListener, undefined, this._disposables);
	}

	public postMessageToWebview<T extends Message = Message>(message: T) {
		this._panel.webview.postMessage(message);
	}
}
