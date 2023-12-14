require("module-alias/register");

import { pollData, setConnetionSettings, stopPolling } from "./connection";
import { LocalhostConnection } from "@type/connection";
import { ProjectWebview, TreeProvider } from "@views";
import { refreshSidebarTree } from "@views/trees/refreshSidebarTree";
import { applyManifest, buildOnRightClick, themeWatcher } from "@vscommands";
import { commands, ExtensionContext, workspace } from "vscode";

export async function activate(context: ExtensionContext) {
	let connection = {
		isRunning: workspace.getConfiguration().get("autokitteh.serviceEnabled") as boolean,
		timer: undefined,
	} as LocalhostConnection;

	connection = await setConnetionSettings(connection, false);

	let currentProjectView: typeof ProjectWebview;

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
			currentProjectView = ProjectWebview.render(context.extensionUri);
			themeWatcher(currentProjectView);

			await pollData(connection, currentProjectView?.currentPanel, selectedProject);
		}
	);

	context.subscriptions.push(openProjectCommand);

	const disconnectedTree = new TreeProvider(["Click here to connect"]);
	refreshSidebarTree(disconnectedTree);

	commands.registerCommand("autokittehSidebarTree.startPolling", async () => {
		// all to controller
		connection = await setConnetionSettings(connection, true);
		await pollData(connection, currentProjectView?.currentPanel); // Controller
	});

	commands.registerCommand("autokittehSidebarTree.stopPolling", async () => {
		// all to controller
		connection = await setConnetionSettings(connection, false);
		refreshSidebarTree(disconnectedTree);
		stopPolling(connection);

		if (currentProjectView.currentPanel) {
			currentProjectView.currentPanel.dispose();
		}
		// all to controller
	});

	/*** Build manifest using "Autokitteh V2: Apply Manifest" action from the command palette  */
	context.subscriptions.push(
		commands.registerCommand("autokitteh.v2.applyManifest", applyManifest)
	);
}
