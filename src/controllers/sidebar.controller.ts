import { User } from "@ak-proto-ts/users/v1/user_pb";
import { BASE_URL, vsCommands } from "@constants";
import { ConnectionHandler } from "@controllers/utilities/connectionHandler";
import { ResponseHandler } from "@controllers/utilities/responseHandler";
import { translate } from "@i18n";
import { AuthorizationService, ProjectsService } from "@services";
import { MessageHandler } from "@views";
import { ISidebarView } from "interfaces";
import isEqual from "lodash/isEqual";
import { window } from "vscode";

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
		if (!(await ConnectionHandler.getConnectionStatus())) {
			this.disconnect();
			return;
		}

		this.user = await ResponseHandler.handleServiceResponse(
			AuthorizationService.whoAmI(),
			undefined,
			translate().t("errors.noUserFound")
		);
		if (!this.user) {
			return;
		}

		this.noProjectMessageDisplayed = false;

		this.startInterval();
	};

	private fetchProjects = async (userId: string): Promise<SidebarTreeItem[] | undefined> => {
		const projects = await ResponseHandler.handleServiceResponse(ProjectsService.list(userId));
		if (projects) {
			return projects.map((project) => ({
				label: project.name,
				key: project.projectId,
			}));
		}
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
			if (!projects || (!projects.length && !this.noProjectMessageDisplayed)) {
				if (!this.noProjectMessageDisplayed) {
					MessageHandler.errorMessage(translate().t("errors.noProjectsFound"));
				}
				this.noProjectMessageDisplayed = true;
			}
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
		this.stopInterval();
		this.projects = [];
		this.view.refresh([]);
	};

	private stopInterval() {
		if (this.intervalTimerId) {
			clearInterval(this.intervalTimerId);
			this.intervalTimerId = undefined;
		}
	}
}
