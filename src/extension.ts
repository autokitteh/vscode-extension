/* eslint-disable import/first */
require("module-alias/register");

import { commands, ExtensionContext, window, workspace, ConfigurationTarget } from "vscode";

import { BASE_URL, namespaces, vsCommands } from "@constants";
import { SidebarController, TabsManagerController } from "@controllers";
import { AppStateHandler } from "@controllers/utilities/appStateHandler";
import { getLocalResources } from "@controllers/utilities/resources.util";
import eventEmitter from "@eventEmitter";
import { translate } from "@i18n";
import { AuthService, LoggerService, OrganizationsService, ProjectsService } from "@services";
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

			await resetUser();
			await resetOrganization();
			commands.executeCommand("workbench.action.reloadWindow");
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
			await resetUser();
			await resetOrganization();
			commands.executeCommand("workbench.action.reloadWindow");
		}
	});

	context.subscriptions.push(
		workspace.onDidSaveTextDocument(async (document) => {
			const autoSaveFilesToAk = workspace
				.getConfiguration("autokitteh", document.uri)
				.get<boolean>("autoSaveFilesToAkOnEditorSave", false);
			if (!autoSaveFilesToAk) {
				return;
			}

			const workspaceFolder = workspace.getWorkspaceFolder(document.uri);
			if (!workspaceFolder) {
				return;
			}

			try {
				if (!window.activeTextEditor) {
					const errorMsg = translate().t("projects.autoSaveNoActiveEditor");
					LoggerService.error(namespaces.projectService, errorMsg);
					commands.executeCommand(vsCommands.showErrorMessage, errorMsg);
					return;
				}

				const { document } = window.activeTextEditor;
				const filePath = document.uri.fsPath;

				const currentProjectPaths = (await commands.executeCommand(
					vsCommands.getContext,
					"projectsPaths"
				)) as unknown as string;

				if (!currentProjectPaths) {
					LoggerService.error(namespaces.projectService, translate().t("projects.autoSaveNoProjectsFound"));
					return;
				}

				const projectPathsMap = JSON.parse(currentProjectPaths);
				let projectId: string | undefined;

				for (const [projId, projPath] of Object.entries(projectPathsMap)) {
					if (filePath.startsWith(projPath as string)) {
						projectId = projId;
						break;
					}
				}

				if (!projectId) {
					const errorMsg = translate().t("projects.autoSaveFileNotInProject");
					LoggerService.error(namespaces.projectService, errorMsg);
					return;
				}
				const org1 = workspace.getConfiguration().get("autokitteh.organizationId");
				console.log("org1", org1);
				const organizationId =
					((await commands.executeCommand(vsCommands.getContext, "organizationId")) as string) || undefined;
				console.log("organizationId", organizationId);
				if (!organizationId) {
					console.log("organizationId is undefined");
					const authToken = WorkspaceConfig.getFromWorkspace<string>("authToken", "");

					if (authToken) {
						await commands.executeCommand(vsCommands.changeOrganization);
						return;
					}
				}

				const projectPath = projectPathsMap[projectId] as string;
				const { data: resources, error } = await getLocalResources(projectPath, projectId);

				if (error || !resources) {
					LoggerService.error(
						namespaces.projectService,
						translate().t("projects.autoSaveCollectResourcesFailed", { error: error?.message })
					);
					return;
				}

				const { error: setResourcesError } = await ProjectsService.setResources(projectId, resources);

				if (setResourcesError) {
					LoggerService.error(
						namespaces.projectService,
						translate().t("projects.autoSaveFailed", { error: setResourcesError })
					);
					commands.executeCommand(
						vsCommands.showErrorMessage,
						translate().t("projects.autoSaveFailed", { error: setResourcesError })
					);
				} else {
					LoggerService.info(
						namespaces.projectService,
						translate().t("projects.autoSaveResourcesSetSuccess", { projectId })
					);
					commands.executeCommand(
						vsCommands.showInfoMessage,
						translate().t("projects.autoSaveResourcesUpdatedSuccess", { projectId })
					);
				}
			} catch (error) {
				LoggerService.error(
					namespaces.projectService,
					translate().t("projects.autoSaveError", { error: (error as Error).message })
				);
			}
		})
	);

	context.subscriptions.push(commands.registerCommand(vsCommands.showErrorMessage, MessageHandler.errorMessage));
	let organizationId =
		((await commands.executeCommand(vsCommands.getContext, "organizationId")) as string) || undefined;
	let organizationName =
		((await commands.executeCommand(vsCommands.getContext, "organizationName")) as string) || undefined;

	const authenticationToken = await commands.executeCommand(vsCommands.getContext, "authToken");
	const userId = await commands.executeCommand(vsCommands.getContext, "userId");

	const userAuthorizedWithOrganization = async (onInit: boolean = true) => {
		let currentUserId = userId as string;
		if (!currentUserId) {
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
			currentUserId = user.userId;
			await commands.executeCommand(vsCommands.setContext, "userId", currentUserId);
		}

		if (organizationId && onInit) {
			const { error } = await OrganizationsService.get(organizationId, currentUserId);
			if (error) {
				await commands.executeCommand(vsCommands.showErrorMessage, error);
				await resetUser();
				await resetOrganization();
				return { userAuthenticated: true };
			}
			return {
				selectedOrganizationId: organizationId,
				organizationChosen: true,
				userAuthenticated: true,
			};
		}

		const { data: organizations, error } = await OrganizationsService.list(currentUserId);
		if (error || !organizations?.length) {
			await commands.executeCommand(vsCommands.showErrorMessage, translate().t("organizations.noOrganizationsFound"));
			LoggerService.error(
				namespaces.authentication,
				error
					? translate().t("organizations.noOrganizationsFoundExtended", { error })
					: translate().t("organizations.noOrganizationsFound")
			);
			await resetUser();
			await resetOrganization();
			return { userAuthenticated: true };
		}

		return { userAuthenticated: true, organizations };
	};

	context.subscriptions.push(
		commands.registerCommand(vsCommands.openOrganization, async (organization: SidebarTreeItem) => {
			if (!organization?.key || !organization?.label) {
				return;
			}
			await commands.executeCommand(vsCommands.setContext, "organizationId", organization.key);
			await sidebarController?.fetchData(false, organization.key, organization.label, true);
		})
	);

	context.subscriptions.push(commands.registerCommand(vsCommands.applyManifest, applyManifest));
	context.subscriptions.push(commands.registerCommand(vsCommands.buildFolder, buildOnRightClick));
	context.subscriptions.push(
		commands.registerCommand(vsCommands.changeOrganization, async () => {
			const { organizations } = await userAuthorizedWithOrganization(false);
			if (!organizations?.length) {
				return;
			}

			const organizationPick = await window.showQuickPick(
				organizations.map((organization) => ({ label: organization.name, description: organization.organizationId })),
				{ placeHolder: translate().t("organizations.pickOrganization", { hostUrl: BASE_URL }) }
			);

			if (organizationPick) {
				await commands.executeCommand(vsCommands.setContext, "organizationId", organizationPick.description);
				await commands.executeCommand(vsCommands.setContext, "organizationName", organizationPick.label);
				sidebarController?.fetchData(false, organizationPick.description, organizationPick.label, true);
			}
		})
	);
	context.subscriptions.push(commands.registerCommand(vsCommands.showInfoMessage, MessageHandler.infoMessage));
	context.subscriptions.push(commands.registerCommand(vsCommands.openBaseURLInputDialog, openBaseURLInputDialog));
	context.subscriptions.push(commands.registerCommand(vsCommands.openConfigSetupWalkthrough, openWalkthrough));
	context.subscriptions.push(commands.registerCommand(vsCommands.setAuthToken, setToken));

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
			await initApp();
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
			const isEnabled = await AppStateHandler.get();
			if (!isEnabled) {
				return;
			}
			sidebarController?.disable();
			sidebarController?.dispose();
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
			if (!project) {
				return;
			}
			if (project.label.indexOf("Reconnecting") !== -1 && project.key === undefined) {
				sidebarController?.refreshProjects(false);
				tabsManager?.reconnect();
				return;
			}
			tabsManager?.openWebview(project);
		})
	);

	let sidebarView = new SidebarView();
	let isOrganizationsSidebar = false;

	const initApp = async () => {
		if (authenticationToken) {
			const currentBaseUrl = workspace.getConfiguration().get("autokitteh.baseURL");
			const storedBaseUrl = context.globalState.get("lastBaseUrl");

			if (currentBaseUrl !== storedBaseUrl) {
				await resetUser();
				await resetOrganization();
				await context.globalState.update("lastBaseUrl", currentBaseUrl);
			}

			const {
				organizations: organizationsList,
				selectedOrganizationId,
				userAuthenticated,
			} = await userAuthorizedWithOrganization();

			if (!userAuthenticated) {
				sidebarController = new SidebarController(sidebarView);
				sidebarController?.displayError(translate().t("organizations.userNotFound"));
				return;
			}
			if (!selectedOrganizationId) {
				await resetOrganization();
				organizations = organizationsList;
				isOrganizationsSidebar = true;
			}
		} else {
			await resetOrganization();
			await resetUser();
			organizationId = undefined;
			organizationName = undefined;
		}
		sidebarView.setIsOrganizations(isOrganizationsSidebar);
		let shouldSkipPushToContext;
		if (!sidebarController) {
			sidebarController = new SidebarController(sidebarView, organizationId, organizationName, organizations);
			shouldSkipPushToContext = true;
		}
		sidebarController?.fetchData(isOrganizationsSidebar);

		tabsManager = new TabsManagerController(context);
		if (shouldSkipPushToContext) {
			context.subscriptions.push(sidebarView);
			context.subscriptions.push(sidebarController);
		}

		if (sidebarController && tabsManager) {
			if (!window.registerUriHandler) {
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
			}
		}
	};

	const isAppOn = await AppStateHandler.get();

	if (!isAppOn) {
		return;
	}
	commands.executeCommand(vsCommands.enable);
}
export function deactivate() {
	if (sidebarController) {
		sidebarController.dispose();
	}
	if (tabsManager) {
		tabsManager.dispose();
	}
}
