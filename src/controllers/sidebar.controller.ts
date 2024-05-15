import { Code, ConnectError } from "@connectrpc/connect";
import { namespaces, vsCommands } from "@constants";
import { getLocalResources } from "@controllers/utilities";
import { translate } from "@i18n";
import { LoggerService, ProjectsService } from "@services";
import { SidebarTreeItem } from "@type/views";
import { ISidebarView } from "interfaces";
import isEqual from "lodash.isequal";
import { duration } from "moment";
import { commands, window } from "vscode";

export class SidebarController {
	private view: ISidebarView;
	private intervalTimerId?: NodeJS.Timeout;
	private countdownTimerId?: NodeJS.Timeout;
	private projects?: SidebarTreeItem[];
	private countdown: number;
	private countdownDuration: number;
	initialCountdownDuration = 60;

	constructor(sidebarView: ISidebarView) {
		this.view = sidebarView;
		window.registerTreeDataProvider("autokittehSidebarTree", this.view);
		this.countdownDuration = this.initialCountdownDuration;
		this.countdown = this.countdownDuration;
	}

	public enable = async () => {
		this.refreshProjects();
		this.startFetchInterval();
	};

	private fetchProjects = async (resetCountdown: boolean = false): Promise<SidebarTreeItem[] | undefined> => {
		const { data: projects, error } = await ProjectsService.list();

		if (error) {
			const notification = translate().t("projects.fetchProjectsFailed");
			commands.executeCommand(vsCommands.showErrorMessage, notification);

			LoggerService.error(
				namespaces.projectSidebarController,
				translate().t("projects.fetchProjectsFailedError", { error: (error as Error).message })
			);

			if ((error as ConnectError).code === Code.Unavailable || (error as ConnectError).code === Code.Aborted) {
				if (resetCountdown) {
					this.startCountdown();
					return [
						{
							label: translate().t("general.reconnecting", { countdown: this.formatCountdown(this.countdown) }),
							key: undefined,
						},
					];
				}

				return [
					{
						label: translate().t("general.reconnecting", { countdown: this.formatCountdown(this.countdown) }),
						key: undefined,
					},
				];
			} else {
				return [{ label: translate().t("general.internalError"), key: undefined }];
			}
		}

		this.resetCountdown();

		if (projects!.length) {
			return projects!.map((project) => ({
				label: project.name,
				key: project.projectId,
			}));
		}
		return [{ label: translate().t("projects.noProjectsFound"), key: undefined }];
	};

	private startFetchInterval() {
		this.stopTimers();
		this.intervalTimerId = setInterval(async () => {
			await this.refreshProjects();
		}, 1000);
	}

	public async refreshProjects(resetCountdown: boolean = true) {
		const projects = await this.fetchProjects(resetCountdown);
		if (projects) {
			if (!isEqual(projects, this.projects)) {
				this.projects = projects;
				this.view.refresh(this.projects);
			}
		}
	}

	private startCountdown() {
		this.stopTimers();

		this.countdown = this.countdownDuration;

		this.countdownTimerId = setInterval(() => {
			this.view.refresh([
				{
					label: translate().t("general.reconnecting", { countdown: this.formatCountdown(this.countdown) }),
					key: undefined,
				},
			]);
			this.countdown--;

			if (this.countdown <= 0) {
				clearInterval(this.countdownTimerId);
				this.countdownTimerId = undefined;
				this.countdownDuration *= 2;
				this.refreshProjects();
			}
		}, 1000);
	}

	private formatCountdown(seconds: number): string {
		const momentDuration = duration(seconds, "seconds");
		if (momentDuration.hours() > 0) {
			return `${momentDuration.hours()}h ${momentDuration.minutes()}m ${momentDuration.seconds()}s`;
		} else if (momentDuration.minutes() > 0) {
			return `${momentDuration.minutes()}m ${momentDuration.seconds()}s`;
		} else {
			return `${momentDuration.seconds()}s`;
		}
	}

	private resetCountdown() {
		if (this.countdownTimerId) {
			clearInterval(this.countdownTimerId);
			this.countdownTimerId = undefined;
		}
		this.countdownDuration = this.initialCountdownDuration;
		this.countdown = this.countdownDuration;
		this.startFetchInterval();
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
		this.stopTimers();
		this.resetSidebar();
	};

	private stopTimers() {
		if (this.intervalTimerId) {
			clearInterval(this.intervalTimerId);
			this.intervalTimerId = undefined;
		}
		if (this.countdownTimerId) {
			clearInterval(this.countdownTimerId);
			this.countdownTimerId = undefined;
		}
	}
}
