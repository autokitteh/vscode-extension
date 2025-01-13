import * as fs from "fs";
import isEqual from "lodash.isequal";
import { commands, window } from "vscode";

import { ISidebarView } from "interfaces";

import { Code, ConnectError } from "@connectrpc/connect";
import { BASE_URL, INITIAL_PROJECTS_RETRY_SCHEDULE_INTERVAL, namespaces, vsCommands } from "@constants";
import { getLocalResources } from "@controllers/utilities";
import { RetryScheduler } from "@controllers/utilities/retryScheduler.util";
import { translate } from "@i18n";
import { LoggerService, ProjectsService } from "@services";
import { Organization } from "@type/models";
import { SidebarTreeItem } from "@type/views";

export class SidebarController {
	private view: ISidebarView;
	private projectsSidebarItems?: SidebarTreeItem[];
	private retryScheduler?: RetryScheduler;
	private projectsRetryStarted: boolean = false;
	private strippedBaseURL = BASE_URL.replace(/^https?\:\/\/|\/$/g, "");
	private organizationName?: string = "";
	private organizationId?: string = "";
	private organizations?: Organization[];
	private isOrganizations: boolean = false;

	constructor(
		sidebarView: ISidebarView,
		organizationId?: string,
		organizationName?: string,
		organizations?: Organization[]
	) {
		this.view = sidebarView;
		this.organizationName = organizationName;
		this.organizationId = organizationId;
		this.organizations = organizations;
		window.registerTreeDataProvider("autokittehSidebarTree", this.view);
	}

	public fetchData = async () => {
		if (this.isOrganizations) {
			this.fetchOrganizations(this.organizations || []);
		} else {
			this.retryScheduler?.stopTimers();

			this.retryScheduler = new RetryScheduler(
				INITIAL_PROJECTS_RETRY_SCHEDULE_INTERVAL,
				() => this.refreshProjects(true, "", "", true),
				(countdown) =>
					this.updateViewWithCountdown(
						translate().t("general.reconnecting", {
							countdown,
						}),
						this.organizationId,
						this.organizationName
					)
			);
		}
	};

	public setIsOrganizations = (isOrganizations: boolean) => {
		this.view.setIsOrganizations(isOrganizations);
	};

	public reconnect = () => {
		this.refreshProjects(false);
	};

	public enable = async () => {
		this.retryScheduler?.startFetchInterval();
	};

	private fetchProjects = async (
		resetCountdown: boolean = true,
		organizationId?: string,
		organizationName?: string
	): Promise<SidebarTreeItem[] | undefined> => {
		const { data: projects, error } = await ProjectsService.list(organizationId);
		let organizationNameToDisplay = organizationName ? `on ${organizationName}` : "";

		if (error) {
			this.projectsSidebarItems = undefined;
			LoggerService.error(
				namespaces.projectSidebarController,
				translate().t("projects.fetchProjectsFailedError", { error: (error as Error).message })
			);

			if ((error as ConnectError).code === Code.Unavailable || (error as ConnectError).code === Code.Aborted) {
				if (resetCountdown) {
					this.projectsRetryStarted = true;
					this.retryScheduler?.startCountdown();
					return;
				}

				return;
			} else {
				return [
					{
						label: `🔴 ${translate().t("general.internalError")} ${organizationNameToDisplay} at ${this.strippedBaseURL}`,
						key: undefined,
					},
				];
			}
		}

		if (this.projectsRetryStarted) {
			this.projectsRetryStarted = false;
			this.retryScheduler?.resetCountdown();
		}

		if (projects!.length) {
			return projects!
				.sort((a, b) => a.name.localeCompare(b.name))
				.map((project) => ({
					label: project.name,
					key: project.projectId,
				}));
		}

		return [
			{
				label: `${translate().t("projects.noProjectsFound")} ${organizationNameToDisplay} at ${this.strippedBaseURL}`,
				key: undefined,
			},
		];
	};

	public async refreshProjects(
		resetCountdown: boolean = true,
		organizationId?: string,
		organizationName?: string,
		force?: boolean
	) {
		const refreshOrganizationName = organizationName || this.organizationName;
		const refreshOrganizationId = organizationId || this.organizationId;
		const projects = await this.fetchProjects(resetCountdown, refreshOrganizationId, refreshOrganizationName);
		if (!isEqual(projects, this.projectsSidebarItems) || force) {
			this.projectsSidebarItems = projects;
			this.view.refresh(projects!, refreshOrganizationName);
		}
	}

	private fetchOrganizations = (organizations: Organization[]) => {
		if (!organizations!.length) {
			this.view.refresh([
				{
					label: `${translate().t("organizations.noOrganizationsFound")} at ${this.strippedBaseURL}`,
					key: undefined,
				},
			]);
		}
		const sidebarOrganizationsItems = organizations!.map((organization) => ({
			label: organization.name,
			key: organization.organizationId,
		}));
		if (isEqual(sidebarOrganizationsItems, this.organizations)) {
			return;
		}

		this.view.refresh(sidebarOrganizationsItems);
	};

	private updateViewWithCountdown(countdown: string, organizationId?: string, organizationName?: string) {
		this.view.refresh(
			[
				{
					label: `🔴 ${countdown} on ${this.strippedBaseURL} - ${organizationName}`,
					key: undefined,
				},
			],
			organizationName
		);
		commands.executeCommand(vsCommands.displayProjectCountdown, countdown);
	}

	async buildProject(projectId: string) {
		const projectPath = await this.getResourcesPathFromContext(projectId);
		const { data: mappedResources, error: resourcesError } = await getLocalResources(projectPath, projectId);

		if (resourcesError) {
			commands.executeCommand(vsCommands.showErrorMessage, (resourcesError as Error).message);
			LoggerService.error(namespaces.projectController, (resourcesError as Error).message);
			return;
		}

		const { error, data } = await ProjectsService.build(projectId, mappedResources!);

		if (error) {
			const notification = translate().t("projects.projectBuildFailed", {
				id: projectId,
			});
			const log = `${notification} - ${(error as Error).message}`;
			LoggerService.error(namespaces.projectSidebarController, log);
			return;
		}
		const successMessage = translate().t("projects.projectBuildSucceed", { id: data });
		commands.executeCommand(vsCommands.showInfoMessage, successMessage);
		LoggerService.info(namespaces.projectController, successMessage);
	}

	async getResourcesPathFromContext(projectId: string) {
		const projectFromContext: string = await commands.executeCommand(vsCommands.getContext, "projectsPaths");
		if (!projectFromContext) {
			return;
		}
		const vscodeProjectsPaths = JSON.parse(projectFromContext);
		const projectPath = vscodeProjectsPaths[projectId];
		if (!projectPath || !fs.existsSync(projectPath)) {
			return;
		}
		return projectPath;
	}

	async runProject(projectId: string) {
		const projectPath = await this.getResourcesPathFromContext(projectId);
		const { data: mappedResources, error: resourcesError } = await getLocalResources(projectPath, projectId);

		if (resourcesError) {
			commands.executeCommand(vsCommands.showErrorMessage, (resourcesError as Error).message);
			LoggerService.error(namespaces.projectController, (resourcesError as Error).message);
			return;
		}

		const { error, data: deploymentId } = await ProjectsService.run(projectId, mappedResources!);

		if (error) {
			const notification = translate().t("projects.projectDeployFailed", { id: projectId });
			const log = `${notification} - ${(error as Error).message}`;
			commands.executeCommand(vsCommands.showErrorMessage, notification);
			LoggerService.error(namespaces.projectSidebarController, log);
			return;
		}
		commands.executeCommand(
			vsCommands.showInfoMessage,
			translate().t("projects.projectDeploySucceed", { id: deploymentId })
		);
		LoggerService.info(
			namespaces.projectController,
			translate().t("projects.projectDeploySucceed", { id: deploymentId })
		);
	}

	public resetSidebar = () => {
		this.projectsSidebarItems = [];
		this.view.refresh([], this.organizationName);
	};

	public disable = () => {
		this.resetSidebar();
	};

	public dispose() {
		this.retryScheduler?.stopTimers();
	}
}
