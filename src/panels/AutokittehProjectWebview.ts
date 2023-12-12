import { htmlView } from "@panels/utils/htmlView";
import { messageListener } from "@panels/utils/messageListener";
import { Message } from "@type/message";
import { Disposable, Uri, ViewColumn, Webview, WebviewPanel, window } from "vscode";

/**
 * This class manages the state and behavior of AutokittehProjectWebview webview panels.
 *
 * It contains all the data and methods for:
 *
 * - Creating and rendering AutokittehProjectWebview webview panels
 * - Properly cleaning up and disposing of webview resources when the panel is closed
 * - Setting the HTML (and by proxy CSS/JavaScript) content of the webview panel
 * - Setting message listeners so data can be passed between the webview and extension
 */
export class AutokittehProjectWebview {
	public static currentPanel: AutokittehProjectWebview | undefined;
	private readonly _panel: WebviewPanel;
	private _disposables: Disposable[] = [];

	/**
	 * The AutokittehProjectWebview class private constructor (called only from the render method).
	 *
	 * @param panel A reference to the webview panel
	 * @param extensionUri The URI of the directory containing the extension
	 */
	public constructor(panel: WebviewPanel, extensionUri: Uri) {
		this._panel = panel;

		// Set an event listener to listen for when the panel is disposed (i.e. when the user closes
		// the panel or when the panel is closed programmatically)
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Set the HTML content for the webview panel
		this._panel.webview.html = htmlView(this._panel.webview, extensionUri);
		// Set an event listener to listen for messages passed from the webview context
		this._setWebviewMessageListener(this._panel.webview);
	}

	/**
	 * Renders the current webview panel if it exists otherwise a new webview panel
	 * will be created and displayed.
	 *
	 * @param extensionUri The URI of the directory containing the extension.
	 */
	public static render(extensionUri: Uri) {
		if (AutokittehProjectWebview.currentPanel) {
			// If the webview panel already exists reveal it
			AutokittehProjectWebview.currentPanel._panel.reveal(ViewColumn.Two);
		} else {
			// If a webview panel does not already exist create and show a new one
			const panel = window.createWebviewPanel(
				// Panel view type
				"autokittehShowProject",
				// Panel title
				"Autokitteh Project",
				// The editor column the panel should be displayed in
				ViewColumn.One,
				// Extra panel configurations
				{
					// Enable JavaScript in the webview
					enableScripts: true,
					// Restrict the webview to only load resources from the `out` and `webview-ui/build` directories
					localResourceRoots: [
						Uri.joinPath(extensionUri, "out"),
						Uri.joinPath(extensionUri, "webview-ui/build"),
						Uri.joinPath(extensionUri, "webview-ui/node_modules/@vscode/codicons/dist"),
					],
				}
			);

			AutokittehProjectWebview.currentPanel = new AutokittehProjectWebview(panel, extensionUri);
		}
	}

	/**
	 * Cleans up and disposes of webview resources when the webview panel is closed.
	 */
	public dispose() {
		AutokittehProjectWebview.currentPanel = undefined;

		// Dispose of the current webview panel
		this._panel.dispose();

		// Dispose of all disposables (i.e. commands) for the current webview panel
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
		// post message from extension to webview
		this._panel.webview.postMessage(message);
	}
}
