require("module-alias/register");

import { Theme } from "@enums";
import { AutokittehSidebar, AutokittehWebview } from "@panels";
import { TreeDataProvider } from "@providers";
import { LEFT_PANEL_WEBVIEW_ID } from "@constants/webviews";
import { ThemeMessage } from "@type";
import * as vscode from "vscode";
import { commands, ExtensionContext } from "vscode";
import { applyManifest, buildOnRightClick, sendMessageToExtension } from "@vscommands";

export function activate(context: ExtensionContext) {
	/*** Show the webview as a pane using the "autokitteh react: Show" action from the command palette  */
	const showHelloWorldCommand = commands.registerCommand("hello-world.showHelloWorld", () => {
		AutokittehWebview.render(context.extensionUri);
	});
	context.subscriptions.push(showHelloWorldCommand);

	/*** Add the webview as a sidebar */
	const leftPane = new AutokittehSidebar(context.extensionUri, {});
	const view = vscode.window.registerWebviewViewProvider(LEFT_PANEL_WEBVIEW_ID, leftPane);
	context.subscriptions.push(view);

	/*** Contextual menu "Build autokitteh" on a right click on an "autokitteh.yaml" file in the file explorer */
	const disposable = vscode.commands.registerCommand(
		"autokitteh.v2.buildFolder",
		buildOnRightClick
	);

	context.subscriptions.push(disposable);
	vscode.window.registerTreeDataProvider("sample-tree-view", new TreeDataProvider());

	/*** On theme change:
	 * Send the theme to the webview (light/dark)
	 */
	vscode.window.onDidChangeActiveColorTheme((editor) => {
		if (editor) {
			leftPane.postMessageToWebview<ThemeMessage>({
				type: "THEME",
				payload: editor.kind as number as Theme,
			});
		}
	});

	/*** Send data from the extension to the webview */
	vscode.commands.registerCommand("extension.sendMessage", sendMessageToExtension(leftPane));

	/*** Build manifest using "Autokitteh V2: Apply Manifest" action from the command palette  */
	context.subscriptions.push(
		vscode.commands.registerCommand("autokitteh.v2.applyManifest", applyManifest)
	);
}
