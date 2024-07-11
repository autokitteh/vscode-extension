/* eslint-disable import/first */
require("module-alias/register");

import { commands, ExtensionContext, window, workspace, ConfigurationTarget } from "vscode";

import { namespaces, starlarkLocalLSPDefaultArgs, vsCommands } from "@constants";
import { SidebarController, TabsManagerController } from "@controllers";
import { AppStateHandler } from "@controllers/utilities/appStateHandler";
import { translate } from "@i18n";
import {
	LoggerService,
	StarlarkLSPService,
	StarlarkSocketStreamingService,
	StarlarkVersionManagerService,
} from "@services";
import { SidebarTreeItem } from "@type/views";
import { isStalarkLSPSocketMode, ValidateURL, WorkspaceConfig } from "@utilities";
import { MessageHandler, SidebarView } from "@views";
import { applyManifest, buildOnRightClick, buildProject, runProject, setToken } from "@vscommands";
import { openAddConnectionsPage } from "@vscommands/sideBarActions";
import { openBaseURLInputDialog, openWalkthrough } from "@vscommands/walkthrough";

export async function activate(context: ExtensionContext) {
	workspace.onDidChangeConfiguration(async (event) => {
		if (event.affectsConfiguration("autokitteh.baseURL")) {
			const newBaseURL = WorkspaceConfig.getFromWorkspace<string>("baseURL", "");
			if (!ValidateURL(newBaseURL)) {
				commands.executeCommand(vsCommands.showErrorMessage, translate().t("general.baseURLInvalid"));
				return;
			}
			const userResponseOnWindowReload = await window.showInformationMessage(
				translate().t("general.baseURLChanged"),
				translate().t("general.reload"),
				translate().t("general.dismiss")
			);
			if (userResponseOnWindowReload === translate().t("general.dismiss")) {
				return;
			}
			commands.executeCommand("workbench.action.reloadWindow");
		}
	});

	context.subscriptions.push(commands.registerCommand(vsCommands.applyManifest, applyManifest));
	context.subscriptions.push(commands.registerCommand(vsCommands.buildFolder, buildOnRightClick));
	context.subscriptions.push(commands.registerCommand(vsCommands.showInfoMessage, MessageHandler.infoMessage));
	context.subscriptions.push(commands.registerCommand(vsCommands.showErrorMessage, MessageHandler.errorMessage));
	context.subscriptions.push(commands.registerCommand(vsCommands.openBaseURLInputDialog, openBaseURLInputDialog));
	context.subscriptions.push(commands.registerCommand(vsCommands.openConfigSetupWalkthrough, openWalkthrough));
	context.subscriptions.push(commands.registerCommand(vsCommands.addConnections, openAddConnectionsPage));
	context.subscriptions.push(commands.registerCommand(vsCommands.setAuthToken, setToken));

	context.subscriptions.push(
		commands.registerCommand(vsCommands.buildProject, (focusedItem) => buildProject(focusedItem, sidebarController))
	);
	context.subscriptions.push(
		commands.registerCommand(vsCommands.runProject, (focusedItem) => runProject(focusedItem, sidebarController))
	);
	context.subscriptions.push(
		commands.registerCommand(vsCommands.setContext, (key: string, value: any) => {
			workspace.getConfiguration().update(`autokitteh.${key}`, value, ConfigurationTarget.Global);
		})
	);
	context.subscriptions.push(
		commands.registerCommand(vsCommands.getContext, (key: string) => {
			return workspace.getConfiguration().get(`autokitteh.${key}`);
		})
	);

	const sidebarView = new SidebarView();

	const sidebarController = new SidebarController(sidebarView);
	const tabsManager = new TabsManagerController(context);

	context.subscriptions.push(
		commands.registerCommand(vsCommands.enable, async () => {
			sidebarController.enable();
			tabsManager.enable();
			await AppStateHandler.set(true);
		})
	);

	context.subscriptions.push(
		commands.registerCommand(vsCommands.refreshSidebar, async () => {
			sidebarController.enable();
		})
	);

	context.subscriptions.push(
		commands.registerCommand(vsCommands.disable, async () => {
			sidebarController.disable();
			tabsManager.disable();
			await AppStateHandler.set(false);
		})
	);

	context.subscriptions.push(
		commands.registerCommand(vsCommands.reconnectSidebar, async () => {
			sidebarController.reconnect();
		})
	);

	context.subscriptions.push(
		commands.registerCommand(vsCommands.openWebview, async (project: SidebarTreeItem) => {
			if (project) {
				if (project.label.indexOf("Reconnecting") !== -1 && project.key === undefined) {
					sidebarController.refreshProjects(false);
					tabsManager.reconnect();
					return;
				}
				tabsManager.openWebview(project);
			}
		})
	);

	const isAppOn = await AppStateHandler.get();

	if (isAppOn) {
		commands.executeCommand(vsCommands.enable);
	}

	const initStarlarkLSP = async () => {
		const starlarkLSPPathFromConfig = (await commands.executeCommand(
			vsCommands.getContext,
			"starlarkLSPPath"
		)) as unknown as string;

		const starlarkLSPVersionFromContext = (await commands.executeCommand(
			vsCommands.getContext,
			"starlarkVersion"
		)) as unknown as string;

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
				path: starlarkewPathAfterVersionUpdate,
				version: starlarkNewVersionAfterVersionUpdate,
				error,
				didUpdate,
			} = await StarlarkVersionManagerService.updateLSPVersionIfNeeded(
				starlarkLSPPathFromConfig,
				starlarkLSPVersionFromContext,
				context.extensionPath
			);
			if (error) {
				LoggerService.error(
					namespaces.startlarkLSPServer,
					translate().t("starlark.executableFetchError", { error: error.message })
				);
				commands.executeCommand(vsCommands.showErrorMessage, translate().t("starlark.executableFetch"));
				return;
			}

			if (didUpdate) {
				await commands.executeCommand(vsCommands.setContext, "starlarkLSPPath", starlarkewPathAfterVersionUpdate);
				await commands.executeCommand(vsCommands.setContext, "starlarkVersion", starlarkNewVersionAfterVersionUpdate);

				LoggerService.info(
					namespaces.startlarkLSPServer,
					translate().t("starlark.executableDownloadedSuccessfully", { version: starlarkNewVersionAfterVersionUpdate })
				);
				commands.executeCommand(
					vsCommands.showInfoMessage,
					translate().t("starlark.executableDownloadedSuccessfully", { version: starlarkNewVersionAfterVersionUpdate })
				);
			}

			const starlarkLSPPathForServer = (await commands.executeCommand(
				vsCommands.getContext,
				"starlarkLSPPath"
			)) as unknown as string;

			const starlarkLSPVersionForServer = (await commands.executeCommand(
				vsCommands.getContext,
				"starlarkVersion"
			)) as unknown as string;

			if (starlarkLSPPathForServer === "") {
				LoggerService.error(namespaces.startlarkLSPServer, translate().t("starlark.LSPPathNotSetError"));
				commands.executeCommand(vsCommands.showErrorMessage, translate().t("starlark.LSPPathNotSetError"));
				return;
			}

			let serverOptions = {
				command: starlarkLSPPathForServer,
				args: starlarkLocalLSPDefaultArgs,
			};

			StarlarkLSPService.connectLSPServerLocally(serverOptions, starlarkLSPVersionForServer, starlarkLSPPathForServer);
		}
	};
	initStarlarkLSP();
}
export function deactivate() {
	StarlarkSocketStreamingService.closeConnection();
}
