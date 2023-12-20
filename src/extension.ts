require("module-alias/register");

import { vsCommands } from "@constants";
import { SidebarController } from "@controllers";
import { TabsManagerController } from "@controllers";
import { SidebarView } from "@views";
import { applyManifest, buildOnRightClick } from "@vscommands";
import {
	openBaseURLInputDialog,
	openUsernameInputDialog,
	setUsername,
	setBaseURL,
	openWalkthrough,
} from "@vscommands/walkthrough";
import { commands, ExtensionContext, workspace } from "vscode";

export async function activate(context: ExtensionContext) {
	const sidebarView = new SidebarView();
	const sidebarController = new SidebarController(sidebarView);
	const tabsManager = new TabsManagerController(context);

	commands.registerCommand(vsCommands.connect, async () => {
		sidebarController.connect();
	});
	commands.registerCommand(vsCommands.disconnect, async () => {
		sidebarController.disconnect();
	});
	context.subscriptions.push(
		commands.registerCommand(vsCommands.openWebview, async (project: SidebarTreeItem) => {
			tabsManager.openWebview(project);
		})
	);

	context.subscriptions.push(commands.registerCommand(vsCommands.applyManifest, applyManifest));
	context.subscriptions.push(commands.registerCommand(vsCommands.buildFolder, buildOnRightClick));
	context.subscriptions.push(
		commands.registerCommand(vsCommands.openUsernameInputDialog, openUsernameInputDialog)
	);
	context.subscriptions.push(commands.registerCommand(vsCommands.setUsername, setUsername));
	context.subscriptions.push(
		commands.registerCommand(vsCommands.openBaseURLInputDialog, openBaseURLInputDialog)
	);
	context.subscriptions.push(commands.registerCommand(vsCommands.setBaseURL, setBaseURL));
	context.subscriptions.push(commands.registerCommand(vsCommands.walkthrough, openWalkthrough));

	const isConnected = (await workspace
		.getConfiguration()
		.get("autokitteh.serviceEnabled")) as boolean;

	if (isConnected) {
		sidebarController.connect();
	}
}
