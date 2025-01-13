/* eslint-disable import/first */
require("module-alias/register");

import { commands, ExtensionContext, window, workspace, ConfigurationTarget } from "vscode";

import { namespaces, vsCommands } from "@constants";
import { SidebarController, TabsManagerController } from "@controllers";
import { AppStateHandler } from "@controllers/utilities/appStateHandler";
import eventEmitter from "@eventEmitter";
import { translate } from "@i18n";
import { AuthService, LoggerService, OrganizationsService } from "@services";
import { Organization } from "@type/models";
import { SidebarTreeItem } from "@type/views";
import { ValidateURL, WorkspaceConfig } from "@utilities";
import { MessageHandler, SidebarView } from "@views";
import { applyManifest, buildOnRightClick, buildProject, runProject, setToken } from "@vscommands";
import { openBaseURLInputDialog, openWalkthrough } from "@vscommands/walkthrough";

let sidebarController: SidebarController | null = null;
let tabsManager: TabsManagerController | null = null;
let organizations: Organization[] | undefined = undefined;

export async function activate(context: ExtensionContext) {
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

	const resetUser = async () => await commands.executeCommand(vsCommands.setContext, "userId", "");
	const resetOrganization = async () => {
		await commands.executeCommand(vsCommands.setContext, "organizationId", "");
		await commands.executeCommand(vsCommands.setContext, "organizationName", "");
	};

	context.subscriptions.push(
		commands.registerCommand(vsCommands.reloadProjects, async (organizationId?: string, organizationName?: string) => {
			const organizationIdForSideBar =
				organizationId || (await commands.executeCommand(vsCommands.getContext, "organizationId"));
			const organizationNameForSideBar =
				organizationName || (await commands.executeCommand(vsCommands.getContext, "organizationName"));
			sidebarController?.refreshProjects(true, organizationIdForSideBar, organizationNameForSideBar, true);
		})
	);

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
			return;
		}
		if (event.affectsConfiguration("autokitteh.authToken")) {
			const userResponseOnWindowReload = await window.showInformationMessage(
				translate().t("general.tokenChanged"),
				translate().t("general.reload"),
				translate().t("general.dismiss")
			);
			if (userResponseOnWindowReload === translate().t("general.dismiss")) {
				return;
			}
			const authToken = await commands.executeCommand(vsCommands.getContext, "authToken");

			if (!authToken) {
				await resetUser();
				await resetOrganization();
			}
			commands.executeCommand("workbench.action.reloadWindow");
		}
	});

	context.subscriptions.push(commands.registerCommand(vsCommands.showErrorMessage, MessageHandler.errorMessage));
	const organizationId =
		((await commands.executeCommand(vsCommands.getContext, "organizationId")) as string) || undefined;
	const organizationName =
		((await commands.executeCommand(vsCommands.getContext, "organizationName")) as string) || undefined;

	const authenticationToken = await commands.executeCommand(vsCommands.getContext, "authToken");
	const userId = await commands.executeCommand(vsCommands.getContext, "userId");

	const userAuthorizedWithOrganization = async (
		onInit: boolean = true
	): Promise<{
		organizations?: Organization[];
		userAuthenticated?: boolean;
		organizationChosen?: boolean;
		selectedOrganizationId?: string;
	}> => {
		let currentUserId = userId as string;
		if (!userId) {
			const { data: user, error } = await AuthService.whoAmI();
			if (error || !user?.userId) {
				await commands.executeCommand(vsCommands.showErrorMessage, translate().t("organizations.userNotFound"));
				LoggerService.error(
					namespaces.authentication,
					translate().t("organizations.userNotFoundExtended", {
						error: (error as Error).message || translate().t("organizations.userNotFound"),
					})
				);
				await resetUser();
				await resetOrganization();

				return { userAuthenticated: false };
			}
			currentUserId = user!.userId;
			await commands.executeCommand(vsCommands.setContext, "userId", user!.userId);
		}
		if (organizationId && onInit) {
			const { error } = await OrganizationsService.get(organizationId);
			if (error) {
				await commands.executeCommand(vsCommands.showErrorMessage, error);
				await resetOrganization();
				return { userAuthenticated: true };
			}

			return { selectedOrganizationId: organizationId, organizationChosen: true, userAuthenticated: true };
		}

		const { data: organizations } = await OrganizationsService.list(currentUserId);
		if (!organizations?.length) {
			await commands.executeCommand(vsCommands.showErrorMessage, translate().t("organizations.noOrganizationsFound"));
			LoggerService.error(namespaces.authentication, translate().t("organizations.noOrganizationsFoundExtended"));
			await resetUser();
			await resetOrganization();

			return { userAuthenticated: true };
		}

		context.subscriptions.push(
			commands.registerCommand(vsCommands.openOrganization, async (organization: SidebarTreeItem) => {
				if (organization) {
					await commands.executeCommand(vsCommands.setContext, "organizationId", organization.key);
					sidebarController?.setIsOrganizations(false);
					sidebarController?.refreshProjects(true, organization.key, organization.label, true);
				}
			})
		);

		return { userAuthenticated: true, organizations };
	};

	let sidebarView = new SidebarView();

	if (authenticationToken) {
		const {
			organizations: organizationsList,
			selectedOrganizationId,
			userAuthenticated,
		} = await userAuthorizedWithOrganization();
		if (!userAuthenticated) {
			return;
		}
		if (!selectedOrganizationId) {
			await resetOrganization();
			organizations = organizationsList;
			sidebarView.setIsOrganizations(true);
		}
	}

	sidebarController = new SidebarController(sidebarView, organizationId, organizationName, organizations);

	tabsManager = new TabsManagerController(context);

	context.subscriptions.push(sidebarView);
	context.subscriptions.push(sidebarController);

	context.subscriptions.push(commands.registerCommand(vsCommands.applyManifest, applyManifest));
	context.subscriptions.push(commands.registerCommand(vsCommands.buildFolder, buildOnRightClick));
	context.subscriptions.push(
		commands.registerCommand(vsCommands.changeOrganization, async () => {
			const { organizations } = await userAuthorizedWithOrganization(false);
			if (!organizations?.length) {
				return;
			}
		})
	);
	context.subscriptions.push(commands.registerCommand(vsCommands.showInfoMessage, MessageHandler.infoMessage));
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
