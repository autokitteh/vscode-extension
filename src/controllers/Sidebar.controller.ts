import { User } from "@ak-proto-ts/users/v1/user_pb";
import { BASE_URL } from "@constants";
import { DEFAULT_SIDEBAR_VIEW_REFRESH_INTERVAL } from "@constants/extensionConfiguration.constans";
import { translate } from "@i18n";
import { AuthorizationService, ProjectsService } from "@services";
import { ValidateURL } from "@utilities";
import { MessageHandler } from "@views";
import { ISidebarView } from "interfaces";
import isEqual from "lodash/isEqual";
import { ConfigurationTarget, window, workspace } from "vscode";

export class SidebarController {
	private view: ISidebarView;
	private intervalTimerId?: NodeJS.Timeout;
	private user?: User;
	private refreshRate: number;
	private projects?: SidebarTreeItem[];

	constructor(sidebarView: ISidebarView) {
		this.view = sidebarView;
		window.registerTreeDataProvider("autokittehSidebarTree", this.view);
		this.refreshRate = workspace
			.getConfiguration()
			.get("autokitteh.sidebar.refresh.interval", DEFAULT_SIDEBAR_VIEW_REFRESH_INTERVAL);
	}

	public connect = async () => {
		if (!ValidateURL(BASE_URL)) {
			MessageHandler.errorMessage(translate().t("errors.badHostURL"));
			return;
		}

		this.user = await AuthorizationService.whoAmI();
		if (!this.user) {
			MessageHandler.errorMessage(translate().t("errors.noUserFound"));
			return;
		}
		this.updateServiceEnabled(true);
		try {
			const projects = await this.fetchProjects(this.user);
			if (!projects.length) {
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

	private fetchProjects = async (user: User): Promise<SidebarTreeItem[]> => {
		return (await ProjectsService.list(user.userId)).map((project) => ({
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
			const projects = await this.fetchProjects(this.user);
			if (!isEqual(projects, this.projects)) {
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
