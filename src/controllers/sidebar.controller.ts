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
import { SidebarTreeItem } from "@type/views";

export class SidebarController {
	private view: ISidebarView;
	private projects?: SidebarTreeItem[];
	private retryScheduler: RetryScheduler;
	private projectsRetryStarted: boolean = false;
	private strippedBaseURL = BASE_URL.replace(/^https?\:\/\/|\/$/g, "");

	constructor(sidebarView: ISidebarView) {
		this.view = sidebarView;
		window.registerTreeDataProvider("autokittehSidebarTree", this.view);
		this.retryScheduler = new RetryScheduler(
			INITIAL_PROJECTS_RETRY_SCHEDULE_INTERVAL,
			() => this.refreshProjects(),
			(countdown) =>
				this.updateViewWithCountdown(
					translate().t("general.reconnecting", {
						countdown,
					})
				)
		);
	}

	public reconnect = () => {
		this.refreshProjects(false);
	};

	public enable = async () => {
		this.retryScheduler.startFetchInterval();
	};

	private fetchProjects = async (resetCountdown: boolean = true): Promise<SidebarTreeItem[] | undefined> => {
		const { data: projects, error } = await ProjectsService.list();

		if (error) {
			this.projects = undefined;
			LoggerService.error(
				namespaces.projectSidebarController,
				translate().t("projects.fetchProjectsFailedError", { error: (error as Error).message })
			);

			if ((error as ConnectError).code === Code.Unavailable || (error as ConnectError).code === Code.Aborted) {
				if (resetCountdown) {
					this.projectsRetryStarted = true;
					this.retryScheduler.startCountdown();
					return;
				}

				return;
			} else {
				return [
					{
						label: `🔴 ${translate().t("general.internalError")} on ${this.strippedBaseURL}`,
						key: undefined,
					},
				];
			}
		}

		if (this.projectsRetryStarted) {
			this.projectsRetryStarted = false;
			this.retryScheduler.resetCountdown();
		}

		if (projects!.length) {
			return projects!.map((project) => ({
				label: project.name,
				key: project.projectId,
			}));
		}

		return [
			{
				label: `${translate().t("projects.noProjectsFound")} on ${this.strippedBaseURL}`,
				key: undefined,
			},
		];
	};

	public async refreshProjects(resetCountdown: boolean = true) {
		const projects = await this.fetchProjects(resetCountdown);
		if (projects) {
			if (!isEqual(projects, this.projects)) {
				this.projects = projects;
				this.view.refresh(this.projects);
			}
		}
	}

	private updateViewWithCountdown(countdown: string) {
		this.view.refresh([
			{
				label: `🔴 ${countdown} on ${this.strippedBaseURL}`,
				key: undefined,
			},
		]);
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
		this.projects = [];
		this.view.refresh([]);
	};

	public disable = () => {
		this.resetSidebar();
	};

	public dispose() {
		this.retryScheduler.stopTimers();
	}
}
