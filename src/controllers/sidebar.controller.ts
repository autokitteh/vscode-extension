import { Code, ConnectError } from "@connectrpc/connect";
import { INITIAL_RETRY_SCHEDULE_COUNTDOWN, namespaces, vsCommands } from "@constants";
import { RetrySchedulerController } from "@controllers/retryScheduler.controller";
import { getLocalResources } from "@controllers/utilities";
import { translate } from "@i18n";
import { LoggerService, ProjectsService } from "@services";
import { SidebarTreeItem } from "@type/views";
import { ISidebarView } from "interfaces";
import isEqual from "lodash.isequal";
import { commands, window, Disposable } from "vscode";

export class SidebarController {
	private view: ISidebarView;
	private projects?: SidebarTreeItem[];
	private retryScheduler: RetrySchedulerController;
	private disposables: Disposable[] = [];

	constructor(sidebarView: ISidebarView) {
		this.view = sidebarView;
		window.registerTreeDataProvider("autokittehSidebarTree", this.view);
		this.retryScheduler = new RetrySchedulerController(
			INITIAL_RETRY_SCHEDULE_COUNTDOWN,
			() => this.refreshProjects(),
			(countdown) =>
				this.updateViewWithCountdown(
					translate().t("general.reconnecting", {
						countdown,
					})
				)
		);
		this.retryScheduler.startFetchInterval();
	}

	public reEnable = () => {
		this.refreshProjects(false);
	};

	public enable = async () => {
		this.refreshProjects();
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
					this.retryScheduler.startCountdown();
					return;
				}

				return;
			} else {
				return [{ label: translate().t("general.internalError"), key: undefined }];
			}
		}

		this.retryScheduler.resetCountdown();

		if (projects!.length) {
			return projects!.map((project) => ({
				label: project.name,
				key: project.projectId,
			}));
		}
		return [{ label: translate().t("projects.noProjectsFound"), key: undefined }];
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
				label: countdown,
				key: undefined,
			},
		]);
	}

	async buildProject(projectId: string) {
		const { data: mappedResources, error: resourcesError } = await getLocalResources(projectId);
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

	async runProject(projectId: string) {
		const { data: mappedResources, error: resourcesError } = await getLocalResources(projectId);
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
		this.disposables.forEach((disposable) => disposable.dispose());
	}
}
