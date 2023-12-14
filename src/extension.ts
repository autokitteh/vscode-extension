require("module-alias/register");

import { setConnetionSettings, stopPolling } from "./connection";
import { AKWebview, MyTreeStrProvider } from "@panels";
import { pushDataToWebview } from "@panels/utils/setupDataPolling";
import { LocalhostConnection } from "@type/connection";
import { refreshSidebarTree } from "@utilities/refreshSidebarTree";
import { applyManifest, buildOnRightClick } from "@vscommands";
import { changeTheme, themeWatcher } from "@vscommands/themeHandler";
import { commands, ExtensionContext, workspace } from "vscode";

export async function activate(context: ExtensionContext) {
	let connection = {
		isRunning: workspace.getConfiguration().get("autokitteh.serviceEnabled") as boolean,
		timer: undefined,
	} as LocalhostConnection;

	connection = await setConnetionSettings(connection, false);

	let currentProjectView: typeof AKWebview;

	/*** Contextual menu "Build autokitteh" on a right click on an "autokitteh.yaml" file in the file explorer */
	const buildAutokitteh = commands.registerCommand("autokitteh.v2.buildFolder", buildOnRightClick);

	context.subscriptions.push(buildAutokitteh);

	/*** On webview open:
	 * - Render the view
	 * - Send the theme to the webview (light/dark)
	 */
	const openProjectCommand = commands.registerCommand(
		"autokitteh.openWebview",
		async (selectedProject) => {
			currentProjectView = AKWebview.render(context.extensionUri);
			changeTheme(currentProjectView);

			await pushDataToWebview(currentProjectView, connection, selectedProject);
		}
	);

	context.subscriptions.push(openProjectCommand);

	const disconnectedTree = new MyTreeStrProvider(["Click here to connect"]);
	refreshSidebarTree(disconnectedTree);

	commands.registerCommand("autokittehSidebarTree.startPolling", async () => {
		connection = await setConnetionSettings(connection, true);
		await pushDataToWebview(currentProjectView, connection);
	});

	commands.registerCommand("autokittehSidebarTree.stopPolling", async () => {
		connection = await setConnetionSettings(connection, false);
		refreshSidebarTree(disconnectedTree);
		stopPolling(connection);

		if (currentProjectView.currentPanel) {
			currentProjectView.currentPanel.dispose();
		}
	});

	/*** Build manifest using "Autokitteh V2: Apply Manifest" action from the command palette  */
	context.subscriptions.push(
		commands.registerCommand("autokitteh.v2.applyManifest", applyManifest)
	);
}
