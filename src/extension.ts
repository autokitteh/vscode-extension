require("module-alias/register");

import { EXT_PUBLISHER } from "@constants";
import { AppSync } from "@controllers/AppSync";
import { LocalhostConnection } from "@type/connection";
import { ProjectWebview } from "@views";
import { applyManifest, buildOnRightClick, openWebview, themeWatcher } from "@vscommands";
import {
	getBaseURL,
	getUsername,
	setUsername,
	setBaseURL,
	connectAK,
	openWalkthrough,
} from "@vscommands/walkthrough";
import { commands, ExtensionContext, workspace } from "vscode";

export async function activate(context: ExtensionContext) {
	let connection = {
		isRunning: workspace.getConfiguration().get("autokitteh.serviceEnabled") as boolean,
		timer: undefined,
	} as LocalhostConnection;

	let currentProjectView: typeof ProjectWebview;

	commands.registerCommand("autokitteh.v2.startPolling", async () => {
		connection = await AppSync.pollData(connection, currentProjectView?.currentPanel);
	});
	commands.registerCommand("autokitteh.v2.stopPolling", async () => {
		AppSync.stopPolling(connection, currentProjectView?.currentPanel);
	});

	context.subscriptions.push(
		commands.registerCommand("autokitteh.openWebview", async (selectedProject) => {
			const { connection: responseConnection, projectView } = await openWebview(
				selectedProject,
				currentProjectView,
				context,
				connection
			);
			connection = responseConnection;
			currentProjectView = projectView;
		})
	);
	context.subscriptions.push(
		commands.registerCommand("autokitteh.v2.applyManifest", applyManifest)
	);
	context.subscriptions.push(
		commands.registerCommand("autokitteh.v2.buildFolder", buildOnRightClick)
	);
	context.subscriptions.push(commands.registerCommand("autokitteh.v2.getUsername", getUsername));
	context.subscriptions.push(commands.registerCommand("autokitteh.v2.setUsername", setUsername));
	context.subscriptions.push(commands.registerCommand("autokitteh.v2.getBaseURL", getBaseURL));
	context.subscriptions.push(commands.registerCommand("autokitteh.v2.setBaseURL", setBaseURL));

	context.subscriptions.push(
		commands.registerCommand("autokitteh.v2.walkthrough", openWalkthrough)
	);

	if (connection.isRunning) {
		commands.executeCommand("autokitteh.v2.startPolling");
	}
}
