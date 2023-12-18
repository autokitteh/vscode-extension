require("module-alias/register");

import { vsCommands } from "@constants";
import { AppSync } from "@controllers/AppSync";
import { LocalhostConnection } from "@type/connection";
import { ProjectWebview } from "@views";
import { applyManifest, buildOnRightClick, openWebview } from "@vscommands";
import {
	getBaseURL,
	getUsername,
	setUsername,
	setBaseURL,
	openWalkthrough,
} from "@vscommands/walkthrough";
import { commands, ExtensionContext, workspace } from "vscode";

export async function activate(context: ExtensionContext) {
	let connection = {
		isRunning: workspace.getConfiguration().get("autokitteh.serviceEnabled") as boolean,
		timer: undefined,
	} as LocalhostConnection;

	let currentWebview: typeof ProjectWebview;

	commands.registerCommand(vsCommands.startPolling, async () => {
		connection = await AppSync.pollData(connection, currentWebview?.currentPanel);
	});
	commands.registerCommand(vsCommands.stopPolling, async () => {
		AppSync.stopPolling(connection, currentWebview?.currentPanel);
	});
	context.subscriptions.push(
		commands.registerCommand(vsCommands.openWebview, async (selectedProject) => {
			const { connection: responseConnection, projectView } = await openWebview(
				selectedProject,
				currentWebview,
				context,
				connection
			);
			connection = responseConnection;
			currentWebview = projectView;
		})
	);
	context.subscriptions.push(commands.registerCommand(vsCommands.applyManifest, applyManifest));
	context.subscriptions.push(commands.registerCommand(vsCommands.buildFolder, buildOnRightClick));
	context.subscriptions.push(commands.registerCommand(vsCommands.getUsername, getUsername));
	context.subscriptions.push(commands.registerCommand(vsCommands.setUsername, setUsername));
	context.subscriptions.push(commands.registerCommand(vsCommands.getBaseURL, getBaseURL));
	context.subscriptions.push(commands.registerCommand(vsCommands.setBaseURL, setBaseURL));

	context.subscriptions.push(commands.registerCommand(vsCommands.walkthrough, openWalkthrough));

	if (connection.isRunning) {
		commands.executeCommand(vsCommands.startPolling);
	}
}
