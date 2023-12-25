import { User } from "@ak-proto-ts/users/v1/user_pb";
import { vsCommands } from "@constants";
import { ConnectionHandler } from "@controllers/utilities/connectionHandler";
import { RequestHandler } from "@controllers/utilities/requestHandler";
import { translate } from "@i18n";
import { AuthorizationService, ProjectsService } from "@services";
import { ISidebarView } from "interfaces";
import isEqual from "lodash/isEqual";
import { commands, window } from "vscode";

export class SidebarController {
	private view: ISidebarView;
	private intervalTimerId?: NodeJS.Timeout;
	private user?: User;
	private refreshRate: number;
	private projects?: SidebarTreeItem[];
	private noProjectMessageDisplayed = false;
	private noUserMessageDisplayed = false;

	constructor(sidebarView: ISidebarView, refreshRate: number) {
		this.view = sidebarView;
		window.registerTreeDataProvider("autokittehSidebarTree", this.view);
		this.refreshRate = refreshRate;
	}

	public connect = async () => {
		if (!ConnectionHandler.isConnected) {
			return;
		}

		this.user = await RequestHandler.handleServiceResponse(() => AuthorizationService.whoAmI(), {
			onFailureMessage: translate().t("errors.noUserFound"),
		});
		if (!this.user) {
			return;
		}

		this.noProjectMessageDisplayed = false;

		this.startInterval();
	};

	private fetchProjects = async (userId: string): Promise<SidebarTreeItem[] | undefined> => {
		const projects = await RequestHandler.handleServiceResponse(() => ProjectsService.list(userId));
		if (projects) {
			return projects.map((project) => ({
				label: project.name,
				key: project.projectId,
			}));
		}
	};

	private startInterval() {
		this.noProjectMessageDisplayed = false;
		this.noUserMessageDisplayed = false;
		this.intervalTimerId = setInterval(() => this.refreshProjects(), this.refreshRate);
	}

	private async refreshProjects() {
		if (!this.user) {
			if (!this.noUserMessageDisplayed) {
				commands.executeCommand(vsCommands.showErrorMessage, translate().t("errors.noUserFound"));
				this.noUserMessageDisplayed = true;
			}
			return;
		}
		const projects = await this.fetchProjects(this.user.userId);
		if (projects) {
			if (!isEqual(projects, this.projects)) {
				this.projects = projects;
				this.view.refresh(this.projects);
			}
		} else if (!this.noProjectMessageDisplayed) {
			commands.executeCommand(vsCommands.showErrorMessage, translate().t("errors.noProjectsFound"));
			this.noProjectMessageDisplayed = true;
		}
	}

	public resetSidebar = async () => {
		this.projects = [];
		this.view.refresh([]);
	};

	public disconnect = async () => {
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
