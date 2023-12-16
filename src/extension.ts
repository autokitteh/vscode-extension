require("module-alias/register");

import { AppSync } from "@controllers/AppSync";
import { initTranslate } from "@i18n/init";
import { SharedContext } from "@services/context";
import { LocalhostConnection } from "@type/connection";
import { ProjectWebview } from "@views";
import { applyManifest, buildOnRightClick, themeWatcher } from "@vscommands";
import { commands, ExtensionContext, workspace } from "vscode";

export async function activate(context: ExtensionContext) {
	let connection = {
		isRunning: workspace.getConfiguration().get("autokitteh.serviceEnabled") as boolean,
		timer: undefined,
	} as LocalhostConnection;

	SharedContext.context = context;
	SharedContext.i18n = initTranslate();

	connection = await AppSync.stopPolling(connection);

	let currentProjectView: typeof ProjectWebview;

	const openProjectCommand = commands.registerCommand(
		"autokitteh.openWebview",
		async (selectedProject) => {
			currentProjectView = ProjectWebview.render(context.extensionUri);
			themeWatcher(currentProjectView);

			connection = await AppSync.pollData(
				connection,
				currentProjectView?.currentPanel,
				selectedProject
			);
		}
	);
	context.subscriptions.push(openProjectCommand);

	commands.registerCommand("autokittehSidebarTree.startPolling", async () => {
		connection = await AppSync.pollData(connection, currentProjectView?.currentPanel); // Controller
	});
	commands.registerCommand("autokittehSidebarTree.stopPolling", async () => {
		AppSync.stopPolling(connection, currentProjectView.currentPanel);
	});

	context.subscriptions.push(
		commands.registerCommand("autokitteh.v2.applyManifest", applyManifest)
	);
	context.subscriptions.push(
		commands.registerCommand("autokitteh.v2.buildFolder", buildOnRightClick)
	);
}
