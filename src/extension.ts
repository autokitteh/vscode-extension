require("module-alias/register");

import { AppSync } from "@controllers/AppSync";
import { LocalhostConnection } from "@type/connection";
import { ProjectWebview } from "@views";
import { applyManifest, buildOnRightClick, themeWatcher } from "@vscommands";
import {
	getAKEndpoint,
	getUsername,
	setUsername,
	setAKEndpoint,
	connectAK,
} from "@vscommands/walkthrough";
import { commands, ExtensionContext, workspace } from "vscode";

export async function activate(context: ExtensionContext) {
	let connection = {
		isRunning: workspace.getConfiguration().get("autokitteh.serviceEnabled") as boolean,
		timer: undefined,
	} as LocalhostConnection;

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

	commands.registerCommand("autokitteh.v2.startPolling", async () => {
		connection = await AppSync.pollData(connection, currentProjectView?.currentPanel);
	});
	commands.registerCommand("autokitteh.v2.stopPolling", async () => {
		AppSync.stopPolling(connection, currentProjectView?.currentPanel);
	});

	context.subscriptions.push(
		commands.registerCommand("autokitteh.v2.applyManifest", applyManifest)
	);
	context.subscriptions.push(
		commands.registerCommand("autokitteh.v2.buildFolder", buildOnRightClick)
	);

	context.subscriptions.push(commands.registerCommand("autokitteh.v2.getUsername", getUsername));

	context.subscriptions.push(commands.registerCommand("autokitteh.v2.setUsername", setUsername));

	context.subscriptions.push(
		commands.registerCommand("autokitteh.v2.getAKEndpoint", getAKEndpoint)
	);

	context.subscriptions.push(
		commands.registerCommand("autokitteh.v2.setAKEndpoint", setAKEndpoint)
	);

	context.subscriptions.push(
		commands.registerCommand("autokitteh.v2.openAK", async () => {
			if (currentProjectView) {
				commands.executeCommand("workbench.view.extension.<yourViewContainerNameHere");
			}
		})
	);
}
