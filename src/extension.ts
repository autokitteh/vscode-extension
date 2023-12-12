require("module-alias/register");

import { LEFT_PANEL_WEBVIEW_ID } from "@constants/webviews";
import { Theme } from "@enums";
import { AutokittehSidebar, AutokittehWebview, MyTreeStrProvider } from "@panels";
import {
	deploymentService,
	environmentService,
	integrationService,
	organizationService,
	projectService,
	userService,
} from "@services/services";
import { Message, MessageType } from "@type";
import { applyManifest, buildOnRightClick, sendMessageToExtension } from "@vscommands";
import { commands, ExtensionContext, window as vscodeWindow } from "vscode"; // combined import
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
			leftPane.postMessageToWebview<Message>({
				type: MessageType.theme,
				payload: editor.kind as number as Theme,
			});
		}
	});

	const organizations = await organizationService.list();
	const myUser = await userService.getUserByName("george");

	const organization = await organizationService.getOrganizationByName(organizations![0]);
	const integrations = await integrationService.list(organization!.orgId);
	const projects = await projectService.list(myUser!.userId);
	const projectsArr = projects?.map((int) => int.name) as string[];
	const environments = await environmentService.list(projects![0].projectId);
	const deployments = await deploymentService.list(environments![0].envId);

	const myTree = new MyTreeStrProvider(projectsArr);

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
				type: MessageType.deployments,
				payload: deployments,
			});
			AutokittehWebview.currentPanel.postMessageToWebview({
				type: MessageType.projectName,
				payload: projects![0].name,
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
