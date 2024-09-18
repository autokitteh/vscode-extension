/* eslint-disable import/first */
require("module-alias/register");

import { commands, ExtensionContext, window, workspace, ConfigurationTarget } from "vscode";

import { namespaces, vsCommands } from "@constants";
import { SidebarController, TabsManagerController } from "@controllers";
import { AppStateHandler } from "@controllers/utilities/appStateHandler";
import eventEmitter from "@eventEmitter";
import { translate } from "@i18n";
import { LoggerService } from "@services";
import { SidebarTreeItem } from "@type/views";
import { ValidateURL, WorkspaceConfig } from "@utilities";
import { MessageHandler, SidebarView } from "@views";
import { applyManifest, buildOnRightClick, buildProject, runProject, setToken } from "@vscommands";
import { openBaseURLInputDialog, openWalkthrough } from "@vscommands/walkthrough";

let sidebarController: SidebarController | null = null;
let tabsManager: TabsManagerController | null = null;

export async function activate(context: ExtensionContext) {
	const sidebarView = new SidebarView();
	sidebarController = new SidebarController(sidebarView);
	tabsManager = new TabsManagerController(context);

	context.subscriptions.push(sidebarView);
	context.subscriptions.push(sidebarController);

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
	context.subscriptions.push(commands.registerCommand(vsCommands.setAuthToken, setToken));

	if (sidebarController && tabsManager) {
		window.registerUriHandler({
			async handleUri(uri) {
				const params = new URLSearchParams(uri.query);
				const connectionId = params.get("cid");
				const error = params.get("error");

				if (error) {
					LoggerService.error(namespaces.connectionsController, error);
					commands.executeCommand(vsCommands.showErrorMessage, error);

					return;
				}

				if (!connectionId) {
					return;
				}

				eventEmitter.emit(`connection.${connectionId}.updated`, () =>
					LoggerService.debug(
						namespaces.connectionsController,
						translate().t("connections.connectionInitInProgress", { connectionId })
					)
				);
			},
		});

		context.subscriptions.push(
			commands.registerCommand(vsCommands.buildProject, (focusedItem) => buildProject(focusedItem, sidebarController!))
		);
		context.subscriptions.push(
			commands.registerCommand(vsCommands.runProject, (focusedItem) => runProject(focusedItem, sidebarController!))
		);
		context.subscriptions.push(
			commands.registerCommand(vsCommands.enable, async () => {
				sidebarController?.enable();
				tabsManager?.enable();
				await AppStateHandler.set(true);
			})
		);

		context.subscriptions.push(
			commands.registerCommand(vsCommands.refreshSidebar, async () => {
				sidebarController?.enable();
			})
		);

		context.subscriptions.push(
			commands.registerCommand(vsCommands.disable, async () => {
				sidebarController?.disable();
				tabsManager?.disable();
				await AppStateHandler.set(false);
			})
		);

		context.subscriptions.push(
			commands.registerCommand(vsCommands.reconnectSidebar, async () => {
				sidebarController?.reconnect();
			})
		);

		context.subscriptions.push(
			commands.registerCommand(vsCommands.displayProjectCountdown, (countdown) => {
				tabsManager?.displayProjectCountdown(countdown);
			})
		);

		context.subscriptions.push(
			commands.registerCommand(vsCommands.openWebview, async (project: SidebarTreeItem) => {
				if (project) {
					if (project.label.indexOf("Reconnecting") !== -1 && project.key === undefined) {
						sidebarController?.refreshProjects(false);
						tabsManager?.reconnect();
						return;
					}
					tabsManager?.openWebview(project);
				}
			})
		);
	}

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

	const isAppOn = await AppStateHandler.get();

	if (isAppOn) {
		commands.executeCommand(vsCommands.enable);
	}
}
export function deactivate() {
	if (sidebarController) {
		sidebarController.dispose();
	}
	if (tabsManager) {
		tabsManager.dispose();
	}
}
