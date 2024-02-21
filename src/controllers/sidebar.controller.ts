import { namespaces, vsCommands } from "@constants";
import { getResources } from "@controllers/utilities";
import { translate } from "@i18n";
import { LoggerService, ProjectsService } from "@services";
import { SidebarTreeItem } from "@type/views";
import { ISidebarView } from "interfaces";
import isEqual from "lodash/isEqual";
import { commands, window } from "vscode";

export class SidebarController {
	private view: ISidebarView;
	private intervalTimerId?: NodeJS.Timeout;
	private refreshRate: number;
	private projectsFetchErrorDisplayed: boolean = false;
	private projects?: SidebarTreeItem[];

	constructor(sidebarView: ISidebarView, refreshRate: number) {
		this.view = sidebarView;
		window.registerTreeDataProvider("autokittehSidebarTree", this.view);
		this.refreshRate = refreshRate;
	}

	public connect = async () => {
		this.refreshProjects();

		this.startInterval();
	};

	private fetchProjects = async (): Promise<SidebarTreeItem[] | undefined> => {
		const { data: projects, error } = await ProjectsService.list();

		if (error) {
			if (!this.projectsFetchErrorDisplayed) {
				const notification = translate().t("projects.fetchProjectsFailed");
				commands.executeCommand(vsCommands.showErrorMessage, notification);
				this.projectsFetchErrorDisplayed = true;
			}

			LoggerService.error(
				namespaces.projectSidebarController,
				translate().t("projects.fetchProjectsFailedError", { error: (error as Error).message })
			);
			return;
		}
		if (projects!.length) {
			return projects!.map((project) => ({
				label: project.name,
				key: project.projectId,
			}));
		}
		return [{ label: translate().t("projects.noProjectsFound"), key: undefined }];
	};

	private startInterval() {
		this.intervalTimerId = setInterval(() => this.refreshProjects(), this.refreshRate);
	}

	private async refreshProjects() {
		const projects = await this.fetchProjects();
		if (projects) {
			if (!isEqual(projects, this.projects)) {
				this.projects = projects;
				this.view.refresh(this.projects);
			}
		}
	}

	async buildProject(projectId: string) {
		const { data: mappedResources, error: ResourcesError } = await getResources(projectId);
		if (ResourcesError) {
			commands.executeCommand(vsCommands.showErrorMessage, (ResourcesError as Error).message);
			LoggerService.error(namespaces.projectController, (ResourcesError as Error).message);
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
		const { data: mappedResources, error: ResourcesError } = await getResources(projectId);
		if (ResourcesError) {
			commands.executeCommand(vsCommands.showErrorMessage, (ResourcesError as Error).message);
			LoggerService.error(namespaces.projectController, (ResourcesError as Error).message);
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

	public disconnect = () => {
		this.stopInterval();
		this.resetSidebar();
	};

	private stopInterval() {
		if (this.intervalTimerId) {
			clearInterval(this.intervalTimerId);
			this.intervalTimerId = undefined;
		}
	}
}
