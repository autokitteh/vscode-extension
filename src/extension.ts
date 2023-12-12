require("module-alias/register");

import { fetchData } from "@controllers";
import { Theme } from "@enums";
import { AutokittehWebview, MyTreeStrProvider } from "@panels";
import { Message, MessageType } from "@type";
import { applyManifest, buildOnRightClick } from "@vscommands";
import { commands, ExtensionContext, window as vscodeWindow } from "vscode";
import * as vscode from "vscode";

export async function activate(context: ExtensionContext) {
	const showHelloWorldCommand = commands.registerCommand("hello-world.showHelloWorld", () => {
		AutokittehWebview.render(context.extensionUri);
	});
	context.subscriptions.push(showHelloWorldCommand);

	/*** Contextual menu "Build autokitteh" on a right click on an "autokitteh.yaml" file in the file explorer */
	const disposable = commands.registerCommand("autokitteh.v2.buildFolder", buildOnRightClick);

	context.subscriptions.push(disposable);

	/*** On theme change:
	 * Send the theme to the webview (light/dark)
	 */
	vscodeWindow.onDidChangeActiveColorTheme((editor) => {
		if (editor && AutokittehWebview.currentPanel) {
			AutokittehWebview.currentPanel.postMessageToWebview<Message>({
				type: MessageType.theme,
				payload: editor.kind as number as Theme,
			});
		}
	});

	const TreeLeafCommand = vscode.commands.registerCommand("myExtension.myCommand", (label) => {
		AutokittehWebview.render(context.extensionUri);

		// Check if the current panel exists
		// if (AutokittehWebview.currentPanel) {
		// 	// Send the message to the webview
		// 	AutokittehWebview.currentPanel.postMessageToWebview({
		// 		type: MessageType.deployments,
		// 		payload: deployments,
		// 	});
		// 	AutokittehWebview.currentPanel.postMessageToWebview({
		// 		type: MessageType.projectName,
		// 		payload: projectNamesStrArr![0],
		// 	});
		// } else {
		// 	// Handle the case where the webview is not open
		// 	vscode.window.showInformationMessage("The webview is not open.");
		// }
	});

	context.subscriptions.push(TreeLeafCommand);

	const { projectNamesStrArr, deployments } = await fetchData();

	const myTree = new MyTreeStrProvider(projectNamesStrArr);

	const treeView = vscodeWindow.registerTreeDataProvider("myTreeView", myTree);
	context.subscriptions.push(treeView);

	const myTimer = setInterval(async () => {
		myTree.refresh();
		if (AutokittehWebview.currentPanel) {
			AutokittehWebview.currentPanel.postMessageToWebview({
				type: MessageType.deployments,
				payload: deployments,
			});
			AutokittehWebview.currentPanel.postMessageToWebview({
				type: MessageType.projectName,
				payload: projectNamesStrArr![0],
			});
		}
	}, 1000);

	// setTimeout(() => {
	// 	clearInterval(myTimer);
	// }, 22000);

	context.subscriptions.push(TreeLeafCommand);

	/*** Build manifest using "Autokitteh V2: Apply Manifest" action from the command palette  */
	context.subscriptions.push(
		commands.registerCommand("autokitteh.v2.applyManifest", applyManifest)
	);
}
