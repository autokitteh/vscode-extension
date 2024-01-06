require("module-alias/register");

import { vsCommands } from "@constants";
import { sidebarControllerRefreshRate } from "@constants/api.constants";
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
import { TiltfileErrorWatcher } from "language/errorWatcher";
import { addTiltLinkToStatusBar } from "language/link";
import { TiltfileLspClient } from "language/lspClient";
import { commands, ExtensionContext, workspace, window } from "vscode";

export async function activate(context: ExtensionContext) {
	const sidebarView = new SidebarView();

	const sidebarController = new SidebarController(sidebarView, sidebarControllerRefreshRate);
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
			if (project) {
				tabsManager.openWebview(project);
			}
		})
	);

	const extensionName = "tiltfile";

	let client: TiltfileLspClient;
	let tiltfileErrorWatcher: TiltfileErrorWatcher;

	const ch = window.createOutputChannel("autokitteh-tilt");
	client = new TiltfileLspClient(context, ch);
	client.start();
	tiltfileErrorWatcher = new TiltfileErrorWatcher(context, ch);
	tiltfileErrorWatcher.start();
	addTiltLinkToStatusBar(context);

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
		commands.executeCommand(vsCommands.connect);
	}
}
