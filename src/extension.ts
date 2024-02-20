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
import { WorkspaceConfig, isStalarkLSPSocketMode } from "@utilities";
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
		const starlarkLSPPathFromConfig =
			WorkspaceConfig.getFromWorkspace<string | undefined>("starlarkLSPPath", undefined) ||
			context.workspaceState.get<string>("autokitteh.starlarkLSPPath", "");
		const starlarkLSPVersionFromContext = context.workspaceState.get<string>("autokitteh.starlarkVersion", "");

		if (isStalarkLSPSocketMode(starlarkLSPPathFromConfig)) {
			let serverURL = new URL(starlarkLSPPathFromConfig);

			const port = (serverURL.port && Number(serverURL.port)) as number;
			const host = serverURL.hostname;
			if (!port || !host) {
				LoggerService.error(
					namespaces.startlarkLSPServer,
					translate().t("starlark.invalidSocketURLError", {
						starlarkSocketLspUrl: starlarkLSPPathFromConfig,
						interpolation: { escapeValue: false },
					})
				);
				commands.executeCommand(vsCommands.showErrorMessage, translate().t("starlark.invalidSocketURL"));
				return;
			}

			const serverOptions = () => StarlarkSocketStreamingService.getServerOptionsStreamInfo(host, port);
			StarlarkLSPService.connectLSPServerBySocket(serverOptions, starlarkLSPPathFromConfig);
		} else {
			const {
				path: starlarkPathAfterVersionCheck,
				version: starlarkVersionAfterVersionCheck,
				error,
			} = await StarlarkVersionManagerService.updateLSPVersionIfNeeded(
				starlarkLSPPathFromConfig,
				starlarkLSPVersionFromContext,
				context.extensionPath
			);
			if (error) {
				LoggerService.error(
					namespaces.startlarkLSPServer,
					translate().t("executableFetchError", { error: error.message })
				);
				commands.executeCommand(vsCommands.showErrorMessage, translate().t("executableFetchError"));
			}

			let lspExecutableToStart = starlarkPathAfterVersionCheck || starlarkLSPPathFromConfig;

			const localStarlarkFileExist = fs.existsSync(lspExecutableToStart!);

			if (!localStarlarkFileExist) {
				LoggerService.error(
					namespaces.startlarkLSPServer,
					translate().t("starlark.executableNotFoundError", {
						starlarkLSPPath: lspExecutableToStart,
						interpolation: { escapeValue: false },
					})
				);
				commands.executeCommand(vsCommands.showErrorMessage, translate().t("starlark.executableNotFound"));
			} else {
				if (starlarkVersionAfterVersionCheck !== starlarkLSPVersionFromContext) {
					context.workspaceState.update("autokitteh.starlarkLSPPath", starlarkPathAfterVersionCheck);
					context.workspaceState.update("autokitteh.starlarkVersion", starlarkVersionAfterVersionCheck);
					LoggerService.info(
						namespaces.startlarkLSPServer,
						translate().t("starlark.executableDownloadedSuccessfully", { version: starlarkVersionAfterVersionCheck })
					);
					commands.executeCommand(
						vsCommands.showInfoMessage,
						translate().t("starlark.executableDownloadedSuccessfully", { version: starlarkVersionAfterVersionCheck })
					);
				}

				let serverOptions = {
					command: starlarkLSPPathFromConfig,
					args: starlarkLocalLSPDefaultArgs,
				};

				StarlarkLSPService.connectLSPServerLocally(
					serverOptions,
					starlarkVersionAfterVersionCheck!,
					starlarkPathAfterVersionCheck!
				);
			}
		}
	};
	initStarlarkLSP();
}
export function deactivate() {
	StarlarkSocketStreamingService.closeConnection();
}
