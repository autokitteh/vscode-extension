require("module-alias/register");

import { vsCommands } from "@constants";
import { SidebarController } from "@controllers";
import { TabsManagerController } from "@controllers";
import { ConnectionHandler } from "@controllers/utilities/connectionHandler";
import { MessageHandler, SidebarView } from "@views";
import { applyManifest, buildOnRightClick } from "@vscommands";
import {
	openBaseURLInputDialog,
	openUsernameInputDialog,
	openWalkthrough,
} from "@vscommands/walkthrough";
import { commands, ExtensionContext, workspace } from "vscode";

export async function activate(context: ExtensionContext) {
	const sidebarView = new SidebarView();

	const sidebarController = new SidebarController(
		sidebarView,
		Number(workspace.getConfiguration().get("autokitteh.sidebar.refresh.interval"))
	);
	const tabsManager = new TabsManagerController(context);

	commands.registerCommand(vsCommands.connect, async () => {
		await ConnectionHandler.connect();
		sidebarController.connect();
	});
	commands.registerCommand(vsCommands.testConnection, async () => {
		await ConnectionHandler.testConnection();
	});
	commands.registerCommand(vsCommands.disconnect, async () => {
		await ConnectionHandler.disconnect();
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
	context.subscriptions.push(commands.registerCommand(vsCommands.usernameUpdated, function () {}));
	context.subscriptions.push(
		commands.registerCommand(vsCommands.showInfoMessage, MessageHandler.infoMessage)
	);
	context.subscriptions.push(
		commands.registerCommand(vsCommands.showErrorMessage, MessageHandler.errorMessage)
	);
	context.subscriptions.push(
		commands.registerCommand(vsCommands.openBaseURLInputDialog, openBaseURLInputDialog)
	);
	context.subscriptions.push(
		commands.registerCommand(vsCommands.openConfigSetupWalkthrough, openWalkthrough)
	);

	const isConnected = (await workspace
		.getConfiguration()
		.get("autokitteh.serviceEnabled")) as boolean;

	if (isConnected) {
		commands.executeCommand(vsCommands.testConnection);
	}
}
