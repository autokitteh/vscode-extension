require("module-alias/register");

import * as fs from "fs";
import { vsCommands, sidebarControllerRefreshRate, namespaces, starlarkLocalLSPDefaultArgs } from "@constants";
import { SidebarController } from "@controllers";
import { TabsManagerController } from "@controllers";
import { AppStateHandler } from "@controllers/utilities/appStateHandler";
import { translate } from "@i18n";
import {
	LoggerService,
	StarlarkLSPService,
	StarlarkSocketStreamingService,
	StarlarkVersionManagerService,
} from "@services";
import { SidebarTreeItem } from "@type/views";
import { WorkspaceConfig } from "@utilities";
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

	const initStarlarkLSP = async () => {
		const starlarkSocketLspUrl = WorkspaceConfig.getFromWorkspace<string>("starlarkSocketLspUrl", "");
		const starlarkSocketModeEnabled = WorkspaceConfig.getFromWorkspace<boolean>("starlarkSocketModeEnabled", false);
		const starlarkLSPPath = context.workspaceState.get<string>("autokitteh.starlarkLSP", "");
		const starlarkLSPVersion = context.workspaceState.get<string>("autokitteh.starlarkVersion", "");

		if (starlarkSocketModeEnabled) {
			let serverURL = new URL(starlarkSocketLspUrl);

			const port = (serverURL.port && Number(serverURL.port)) as number;
			const host = serverURL.hostname;
			if (!port || !host) {
				LoggerService.error(
					namespaces.startlarkLSPServer,
					translate().t("starlark.invalidSocketURLError", {
						starlarkSocketLspUrl: starlarkSocketLspUrl,
						interpolation: { escapeValue: false },
					})
				);
				commands.executeCommand(vsCommands.showErrorMessage, translate().t("starlark.invalidSocketURL"));
				return;
			}

			const serverOptions = () => StarlarkSocketStreamingService.getServerOptionsStreamInfo(host, port);
			StarlarkLSPService.startSocketLSPServer(serverOptions, starlarkSocketLspUrl);
		} else {
			const executableLSP = await StarlarkVersionManagerService.updateLSPVersionIfNeeded(
				starlarkLSPPath,
				starlarkLSPVersion,
				context.extensionPath
			);

			const { path: newStarlarkPath, version: newStarlarkVersion, error } = executableLSP!;
			if (error) {
				LoggerService.error(namespaces.startlarkLSPServer, error.message);
				commands.executeCommand(vsCommands.showErrorMessage, error.message);
			}

			const localStarlarkFileExist = fs.existsSync(newStarlarkPath!);

			if (!localStarlarkFileExist) {
				LoggerService.error(
					namespaces.startlarkLSPServer,
					translate().t("starlark.executableNotFoundError", {
						starlarkLSPPath: starlarkLSPPath,
						interpolation: { escapeValue: false },
					})
				);
				commands.executeCommand(vsCommands.showErrorMessage, translate().t("starlark.executableNotFound"));
			} else {
				if (newStarlarkVersion !== starlarkLSPVersion) {
					WorkspaceConfig.setToWorkspace("starlarkLSP", newStarlarkPath);
					context.workspaceState.update("autokitteh.starlarkLSP", newStarlarkPath);
					context.workspaceState.update("autokitteh.starlarkVersion", newStarlarkVersion);
					LoggerService.info(
						namespaces.startlarkLSPServer,
						translate().t("starlark.executableDownloadedSuccessfully", { version: newStarlarkVersion })
					);
					commands.executeCommand(
						vsCommands.showInfoMessage,
						translate().t("starlark.executableDownloadedSuccessfully", { version: newStarlarkVersion })
					);
				}

				let serverOptions = {
					command: starlarkLSPPath,
					args: starlarkLocalLSPDefaultArgs,
				};

				StarlarkLSPService.startLocalLSPServer(serverOptions, newStarlarkVersion!, newStarlarkPath!);
			}
		}
	};
	initStarlarkLSP();
}
export function deactivate() {
	StarlarkSocketStreamingService.closeConnection();
}
