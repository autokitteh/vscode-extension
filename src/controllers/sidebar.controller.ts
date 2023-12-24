import { User } from "@ak-proto-ts/users/v1/user_pb";
import { BASE_URL, vsCommands } from "@constants";
import { translate } from "@i18n";
import { AuthorizationService, ProjectsService } from "@services";
import { ValidateURL } from "@utilities";
import { MessageHandler } from "@views";
import { ISidebarView } from "interfaces";
import isEqual from "lodash/isEqual";
import { ConfigurationTarget, commands, window, workspace } from "vscode";

export class SidebarController {
	private view: ISidebarView;
	private intervalTimerId?: NodeJS.Timeout;
	private user?: User;
	private refreshRate: number;
	private projects?: SidebarTreeItem[];

	constructor(sidebarView: ISidebarView, refreshRate: number) {
		this.view = sidebarView;
		window.registerTreeDataProvider("autokittehSidebarTree", this.view);
		this.refreshRate = refreshRate;
	}

	public connect = async () => {
		if (!ValidateURL(BASE_URL)) {
			MessageHandler.errorMessage(translate().t("errors.badHostURL"));
			commands.executeCommand(vsCommands.disconnect);
			return;
		}

		const { data: user } = await AuthorizationService.whoAmI();
		if (!user) {
			MessageHandler.errorMessage(translate().t("errors.noUserFound"));
			return;
		}
		this.user = user;
		this.updateServiceEnabled(true);
		try {
			const projects = await this.fetchProjects(this.user.userId);
			if (!projects) {
				MessageHandler.errorMessage(translate().t("errors.noProjectsFound"));
				return;
			}

			this.startInterval();
		} catch (error: unknown) {
			if (error instanceof Error) {
				MessageHandler.errorMessage(error.message);
			} else {
				console.error(error);
			}
		}
	};

	private fetchProjects = async (userId: string): Promise<SidebarTreeItem[] | undefined> => {
		const { data: projects } = await ProjectsService.list(userId);
		if (!projects) {
			return undefined;
		}
		return projects.map((project) => ({
			label: project.name,
			key: project.projectId,
		}));
	};

	private startInterval() {
		this.intervalTimerId = setInterval(() => this.refreshProjects(), this.refreshRate);
	}

	private async refreshProjects() {
		try {
			if (!this.user) {
				MessageHandler.errorMessage(translate().t("errors.noUserFound"));
				return;
			}
			const projects = await this.fetchProjects(this.user.userId);
			if (!isEqual(projects, this.projects) && projects) {
				this.projects = projects;
				this.view.refresh(this.projects);
			}
		} catch (error: unknown) {
			if (error instanceof Error) {
				MessageHandler.errorMessage(error.message);
			}
		}
	}

	public disconnect = async () => {
		this.updateServiceEnabled(false);
		this.stopInterval();
		this.projects = [];
		this.view.refresh([]);
	};

	private updateServiceEnabled(enabled: boolean) {
		workspace
			.getConfiguration()
			.update("autokitteh.serviceEnabled", enabled, ConfigurationTarget.Global);
	}

	private stopInterval() {
		if (this.intervalTimerId) {
			clearInterval(this.intervalTimerId);
			this.intervalTimerId = undefined;
		}
	}
}
