require("module-alias/register");

import { vsCommands } from "@constants";
import { sidebarControllerRefreshRate } from "@constants/api.constants";
import { SidebarController } from "@controllers";
import { TabsManagerController } from "@controllers";
import { AppStateHandler } from "@controllers/utilities/appStateHandler";
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

	const sidebarController = new SidebarController(sidebarView, sidebarControllerRefreshRate);
	const tabsManager = new TabsManagerController(context);

	commands.registerCommand(vsCommands.connect, async () => {
		await AppStateHandler.set(true);
		sidebarController.connect();
	});
	commands.registerCommand(vsCommands.disconnect, async () => {
		await AppStateHandler.set(false);
		sidebarController.disconnect();
	});
	context.subscriptions.push(
		commands.registerCommand(vsCommands.openWebview, async (project: SidebarTreeItem) => {
			if (project) {
				tabsManager.openWebview(project);
			}
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

	const isAppOn = await AppStateHandler.get();

	if (isAppOn) {
		commands.executeCommand(vsCommands.connect);
	}
}
