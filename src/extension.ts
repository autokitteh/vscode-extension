require("module-alias/register");

import { Theme } from "@enums";
import { AutokittehSidebar, AutokittehWebview, MyTreeStrProvider } from "@panels";
import { LEFT_PANEL_WEBVIEW_ID } from "@constants/webviews";
import { ThemeMessage } from "@type";
import { commands, ExtensionContext, window as vscodeWindow } from "vscode"; // combined import
import { applyManifest, buildOnRightClick, sendMessageToExtension } from "@vscommands";
import {
	organizationService,
	integrationService,
	projectService,
	userService,
} from "@services/services";
import * as vscode from "vscode";

export async function activate(context: ExtensionContext) {
	const showHelloWorldCommand = commands.registerCommand("hello-world.showHelloWorld", () => {
		AutokittehWebview.render(context.extensionUri);
	});
	context.subscriptions.push(showHelloWorldCommand);

	/*** Add the webview as a sidebar */
	const leftPane = new AutokittehSidebar(context.extensionUri, {});
	const view = vscodeWindow.registerWebviewViewProvider(LEFT_PANEL_WEBVIEW_ID, leftPane);
	context.subscriptions.push(view);

	/*** Contextual menu "Build autokitteh" on a right click on an "autokitteh.yaml" file in the file explorer */
	const disposable = commands.registerCommand("autokitteh.v2.buildFolder", buildOnRightClick);

	context.subscriptions.push(disposable);

	/*** On theme change:
	 * Send the theme to the webview (light/dark)
	 */
	vscodeWindow.onDidChangeActiveColorTheme((editor) => {
		if (editor) {
			leftPane.postMessageToWebview<ThemeMessage>({
				type: "THEME",
				payload: editor.kind as number as Theme,
			});
		}
	});

	const organizations = await organizationService.list();
	const myUser = await userService.getUserByName("george");

	const organization = await organizationService.getOrganizationByName(organizations![0]);
	const integrations = await integrationService.list(organization!.orgId);
	const projects = await projectService.list(myUser!.userId);

	console.log("integrations", projects);

	const intNamesArray = projects?.map((int) => int.name) as string[];

	const myTree = new MyTreeStrProvider(intNamesArray);

	const treeView = vscodeWindow.registerTreeDataProvider("myTreeView", myTree);
	context.subscriptions.push(treeView);

	// Register a command to refresh the tree view
	context.subscriptions.push(
		vscode.commands.registerCommand("myTreeView.refresh", () => {
			myTree.refresh();
		})
	);

	const TreeLeafCommand = vscode.commands.registerCommand("myExtension.myCommand", (label) => {
		AutokittehWebview.render(context.extensionUri);

		// Check if the current panel exists
		if (AutokittehWebview.currentPanel) {
			// Send the message to the webview
			AutokittehWebview.currentPanel.postMessageToWebview({
				type: "COMMON",
				payload: label,
			});
		} else {
			// Handle the case where the webview is not open
			vscode.window.showInformationMessage("The webview is not open.");
		}
	});

	context.subscriptions.push(TreeLeafCommand);

	/*** Send data from the extension to the webview */
	commands.registerCommand("extension.sendMessage", sendMessageToExtension(leftPane));

	/*** Build manifest using "Autokitteh V2: Apply Manifest" action from the command palette  */
	context.subscriptions.push(
		commands.registerCommand("autokitteh.v2.applyManifest", applyManifest)
	);
}
