require("module-alias/register");

import { EXT_PUBLISHER } from "@constants";
import { AppSync } from "@controllers/AppSync";
import { LocalhostConnection } from "@type/connection";
import { ProjectWebview } from "@views";
import { applyManifest, buildOnRightClick, themeWatcher } from "@vscommands";
import {
	getBaseURL,
	getUsername,
	setUsername,
	setBaseURL,
	connectAK,
} from "@vscommands/walkthrough";
import { commands, ExtensionContext, workspace } from "vscode";

export async function activate(context: ExtensionContext) {
	let connection = {
		isRunning: workspace.getConfiguration().get("autokitteh.serviceEnabled") as boolean,
		timer: undefined,
	} as LocalhostConnection;

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

	context.subscriptions.push(commands.registerCommand("autokitteh.v2.getBaseURL", getBaseURL));

	context.subscriptions.push(commands.registerCommand("autokitteh.v2.setBaseURL", setBaseURL));

	context.subscriptions.push(
		commands.registerCommand("autokitteh.v2.walkthrough", () => {
			commands.executeCommand(
				`workbench.action.openWalkthrough`,
				`${EXT_PUBLISHER}.vscode-v2#autokitteh.walkthrough`,
				false
			);
		})
	);

	if (connection.isRunning) {
		connection = await AppSync.pollData(connection, undefined);
	}
}
