require("module-alias/register");

import { vsCommands } from "@constants";
import { ProjectController } from "@controllers/Project.controller";
import { SidebarController } from "@controllers/Sidebar.controller";
import { TabsManagerController } from "@controllers/TabsManager.controller";
import { ProjectView, SidebarView } from "@views";
import { applyManifest, buildOnRightClick } from "@vscommands";
import {
	getBaseURL,
	getUsername,
	setUsername,
	setBaseURL,
	openWalkthrough,
} from "@vscommands/walkthrough";
import { commands, ExtensionContext, workspace } from "vscode";
import * as vscode from "vscode";

export async function activate(context: ExtensionContext) {
	const sidebarView = new SidebarView();
	const sidebarController = new SidebarController(sidebarView);
	const tabsManager = new TabsManagerController();

	commands.registerCommand(vsCommands.startPolling, async () => {
		sidebarController.connect();
	});
	commands.registerCommand(vsCommands.stopPolling, async () => {
		sidebarController.disconnect();
	});
	context.subscriptions.push(
		commands.registerCommand(vsCommands.openWebview, async (project: SidebarTreeItem) => {
			const projectView = new ProjectView(context);
			const projectController = new ProjectController(projectView);
			tabsManager.openWebview(projectController, project);
		})
	);
	context.subscriptions.push(commands.registerCommand(vsCommands.applyManifest, applyManifest));
	context.subscriptions.push(commands.registerCommand(vsCommands.buildFolder, buildOnRightClick));
	context.subscriptions.push(commands.registerCommand(vsCommands.getUsername, getUsername));
	context.subscriptions.push(commands.registerCommand(vsCommands.setUsername, setUsername));
	context.subscriptions.push(commands.registerCommand(vsCommands.getBaseURL, getBaseURL));
	context.subscriptions.push(commands.registerCommand(vsCommands.setBaseURL, setBaseURL));
	context.subscriptions.push(commands.registerCommand(vsCommands.walkthrough, openWalkthrough));

	const isConnected = (await workspace
		.getConfiguration()
		.get("autokitteh.serviceEnabled")) as boolean;

	if (isConnected) {
		sidebarController.connect();
	}
}
