import { User } from "@ak-proto-ts/users/v1/user_pb";
import { ConnectionHandler } from "@controllers/utilities/connectionHandler";
import { translate } from "@i18n";
import { AuthorizationService, ProjectsService } from "@services";
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
	private noProjectMessageDisplayed = false;

	constructor(sidebarView: ISidebarView, refreshRate: number) {
		this.view = sidebarView;
		window.registerTreeDataProvider("autokittehSidebarTree", this.view);
		this.refreshRate = refreshRate;
	}

	public connect = async () => {
		this.user = await AuthorizationService.whoAmI();
		if (!this.user) {
			return;
		}
		this.noProjectMessageDisplayed = false;

		this.updateServiceEnabled(true);
		try {
			const projects = await this.fetchProjects(this.user);
			if (!projects.length) {
				MessageHandler.errorMessage(translate().t("errors.noProjectsFound"));
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
			const isConnected = await ConnectionHandler.getConnectionStatus();
			if (!projects.length && !isConnected) {
				ConnectionHandler.reconnect();
				return;
			}

			if (!projects && !this.noProjectMessageDisplayed) {
				if (!this.noProjectMessageDisplayed) {
					MessageHandler.errorMessage(translate().t("errors.noProjectsFound"));
				}
				this.noProjectMessageDisplayed = true;
			}
			if (projects && !isEqual(projects, this.projects)) {
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
