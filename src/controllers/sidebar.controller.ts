import { Code, ConnectError } from "@connectrpc/connect";
import { namespaces, vsCommands } from "@constants";
import { getLocalResources } from "@controllers/utilities";
import { translate } from "@i18n";
import { LoggerService, ProjectsService } from "@services";
import { SidebarTreeItem } from "@type/views";
import { ISidebarView } from "interfaces";
import isEqual from "lodash.isequal";
import moment from "moment";
import { commands, window } from "vscode";

export class SidebarController {
	private view: ISidebarView;
	private intervalTimerId?: NodeJS.Timeout;
	private countdownTimerId?: NodeJS.Timeout;
	private refreshRate: number;
	private projectsFetchErrorDisplayed: boolean = false;
	private projects?: SidebarTreeItem[];
	private countdown: number;
	private countdownDuration: number;

	constructor(sidebarView: ISidebarView, refreshRate: number) {
		this.view = sidebarView;
		window.registerTreeDataProvider("autokittehSidebarTree", this.view);
		this.refreshRate = refreshRate;
		this.countdownDuration = 10; // initial countdown duration in seconds
		this.countdown = this.countdownDuration;
	}

	public enable = async () => {
		this.refreshProjects();
		this.startFetchInterval();
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

			if ((error as ConnectError).code === Code.Unavailable || (error as ConnectError).code === Code.Aborted) {
				this.startCountdown();
				return [
					{
						label:
							translate().t("general.reconnecting", { countdown: this.formatCountdown(this.countdown) }) +
							" - Retry Now",
						key: undefined,
					},
				];
			} else {
				return [{ label: translate().t("general.internalError"), key: undefined }];
			}
		}

		this.resetCountdown(); // Reset countdown on successful fetch
		this.projectsFetchErrorDisplayed = false;

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

	public async refreshProjects() {
		const projects = await this.fetchProjects();
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
					label:
						translate().t("general.reconnecting", { countdown: this.formatCountdown(this.countdown) }) + " - Retry Now",
					key: undefined,
				},
			]);
			this.countdown--;

			if (this.countdown <= 0) {
				clearInterval(this.countdownTimerId);
				this.countdownTimerId = undefined;
				this.countdownDuration *= 2; // Double the countdown duration for the next retry
				this.refreshProjects(); // Retry fetching projects
			}
		}, 1000);
	}

	private formatCountdown(seconds: number): string {
		const duration = moment.duration(seconds, "seconds");
		if (duration.hours() > 0) {
			return `${duration.hours()}h ${duration.minutes()}m ${duration.seconds()}s`;
		} else if (duration.minutes() > 0) {
			return `${duration.minutes()}m ${duration.seconds()}s`;
		} else {
			return `${duration.seconds()}s`;
		}
	}

	private resetCountdown() {
		if (this.countdownTimerId) {
			clearInterval(this.countdownTimerId);
			this.countdownTimerId = undefined;
		}
		this.countdownDuration = 10; // Reset the countdown duration
		this.countdown = this.countdownDuration;
		this.startFetchInterval(); // Restart the fetch interval
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
