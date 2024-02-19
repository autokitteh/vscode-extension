require("module-alias/register");

import { vsCommands, sidebarControllerRefreshRate } from "@constants";
import { SidebarController } from "@controllers";
import { TabsManagerController } from "@controllers";
import { AppStateHandler } from "@controllers/utilities/appStateHandler";
import { ExtensionContextService, StarlarkLSPService, StarlarkSocketStreamingService } from "@services";
import { SidebarTreeItem } from "@type/views";
import { MessageHandler, SidebarView } from "@views";
import { applyManifest, buildOnRightClick, buildProject, runProject } from "@vscommands";
import { openAddConnectionsPage } from "@vscommands/sideBarActions";
import { openBaseURLInputDialog, openWalkthrough } from "@vscommands/walkthrough";
import { commands, ExtensionContext } from "vscode";

export async function activate(context: ExtensionContext) {
	context.subscriptions.push(commands.registerCommand(vsCommands.applyManifest, applyManifest));
	context.subscriptions.push(commands.registerCommand(vsCommands.buildFolder, buildOnRightClick));
	context.subscriptions.push(commands.registerCommand(vsCommands.showInfoMessage, MessageHandler.infoMessage));
	context.subscriptions.push(commands.registerCommand(vsCommands.showErrorMessage, MessageHandler.errorMessage));
	context.subscriptions.push(commands.registerCommand(vsCommands.openBaseURLInputDialog, openBaseURLInputDialog));
	context.subscriptions.push(commands.registerCommand(vsCommands.openConfigSetupWalkthrough, openWalkthrough));
	context.subscriptions.push(commands.registerCommand(vsCommands.addConnections, openAddConnectionsPage));
	context.subscriptions.push(
		commands.registerCommand(vsCommands.buildProject, (focusedItem) => buildProject(focusedItem, sidebarController))
	);
	context.subscriptions.push(
		commands.registerCommand(vsCommands.runProject, (focusedItem) => runProject(focusedItem, sidebarController))
	);

	const extensionContext = new ExtensionContextService(
		context.workspaceState.update.bind(context.workspaceState),
		context.workspaceState.get.bind(context.workspaceState),
		context.extensionPath
	);

	const { starlarkLSPPath, starlarkLSPVersion, extensionPath } = extensionContext.getLSPConfigurations();

	StarlarkLSPService.initStarlarkLSP(
		starlarkLSPPath,
		starlarkLSPVersion,
		extensionPath,
		context.workspaceState.update.bind(context.workspaceState)
	);
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

	const isAppOn = await AppStateHandler.get();

	if (isAppOn) {
		commands.executeCommand(vsCommands.connect);
	}
}
export function deactivate() {
	StarlarkSocketStreamingService.closeConnection();
}
