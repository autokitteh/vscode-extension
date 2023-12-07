import { Uri, Webview } from "vscode";
import { getUri } from "@utils";
import { getNonce } from "@utils";

export const htmlView = (webview: Webview, extensionUri: Uri) => {
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
};
