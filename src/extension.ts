require("module-alias/register");

import { LocalhostConnection, pollData, stopPolling } from "./connection";
import { fetchData } from "@controllers";
import { Theme } from "@enums";
import { AutokittehProjectWebview, MyTreeStrProvider } from "@panels";
import { Message, MessageType } from "@type";
import { applyManifest, buildOnRightClick } from "@vscommands";
import { commands, ExtensionContext, window as vscodeWindow } from "vscode";
import * as vscode from "vscode";

export async function activate(context: ExtensionContext) {
	const projectWebview = commands.registerCommand("autokitteh.ShowProject", () => {
		AutokittehProjectWebview.render(context.extensionUri);
	});
	context.subscriptions.push(projectWebview);

	/*** Contextual menu "Build autokitteh" on a right click on an "autokitteh.yaml" file in the file explorer */
	const disposable = commands.registerCommand("autokitteh.v2.buildFolder", buildOnRightClick);

	context.subscriptions.push(disposable);

	/*** On theme change:
	 * Send the theme to the webview (light/dark)
	 */
	vscodeWindow.onDidChangeActiveColorTheme((editor) => {
		if (editor && AutokittehProjectWebview.currentPanel) {
			AutokittehProjectWebview.currentPanel.postMessageToWebview<Message>({
				type: MessageType.theme,
				payload: editor.kind as number as Theme,
			});
		}
	});

	/*** On webview open:
	 * - Render the view
	 * - Send the theme to the webview (light/dark)
	 */
	const openProjectCommand = vscode.commands.registerCommand("autokitteh.openWebview", (label) => {
		AutokittehProjectWebview.render(context.extensionUri);

		const theme = vscodeWindow.activeColorTheme.kind as number as Theme;
		if (AutokittehProjectWebview.currentPanel) {
			AutokittehProjectWebview.currentPanel.postMessageToWebview<Message>({
				type: MessageType.theme,
				payload: theme,
			});
		}
	});

	context.subscriptions.push(openProjectCommand);

	const { projectNamesStrArr, deployments } = await fetchData();

	const projectsTree = new MyTreeStrProvider(projectNamesStrArr);

	const projectsSidebarTree = vscodeWindow.registerTreeDataProvider(
		"autokittehSidebarTree",
		projectsTree
	);
	context.subscriptions.push(projectsSidebarTree);

	const connection = {
		isRunning: false,
		timer: undefined,
	} as LocalhostConnection;
	await vscode.workspace
		.getConfiguration()
		.update("autokitteh.enabled", false, vscode.ConfigurationTarget.Global);

	vscode.commands.registerCommand("autokittehSidebarTree.startPolling", () => {
		pollData(
			connection,
			projectsTree,
			deployments,
			AutokittehProjectWebview.currentPanel,
			projectNamesStrArr
		);
	});

	vscode.commands.registerCommand("autokittehSidebarTree.stopPolling", () => {
		stopPolling(connection);
	});

	/*** Build manifest using "Autokitteh V2: Apply Manifest" action from the command palette  */
	context.subscriptions.push(
		commands.registerCommand("autokitteh.v2.applyManifest", applyManifest)
	);
}
