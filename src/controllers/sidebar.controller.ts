import { vsCommands } from "@constants";
import { ConnectionHandler } from "@controllers/utilities/connectionHandler";
import { RequestHandler } from "@controllers/utilities/requestHandler";
import { translate } from "@i18n";
import { ProjectsService } from "@services";
import { ISidebarView } from "interfaces";
import isEqual from "lodash/isEqual";
import { commands, window } from "vscode";

export class SidebarController {
	private view: ISidebarView;
	private intervalTimerId?: NodeJS.Timeout;
	private refreshRate: number;
	private projects?: SidebarTreeItem[];
	private noProjectMessageDisplayed = false;

	constructor(sidebarView: ISidebarView, refreshRate: number) {
		this.view = sidebarView;
		window.registerTreeDataProvider("autokittehSidebarTree", this.view);
		this.refreshRate = refreshRate;
		this.refreshProjects();
	}

	public connect = async () => {
		const isConnected = await ConnectionHandler.getConnectionStatus();
		if (!isConnected) {
			return;
		}

		this.startInterval();
	};

	private fetchProjects = async (): Promise<SidebarTreeItem[] | undefined> => {
		const { data: projects, error } = await RequestHandler.handleServiceResponse(() =>
			ProjectsService.list()
		);
		if (!error && projects) {
			if (projects.length) {
				return projects.map((project) => ({
					label: project.name,
					key: project.projectId,
				}));
			}
			return [{ label: translate().t("projects.noProjectsFound"), key: undefined }];
		}
	};

	private startInterval() {
		this.noProjectMessageDisplayed = false;
		this.intervalTimerId = setInterval(() => this.refreshProjects(), this.refreshRate);
	}

	private async refreshProjects() {
		const projects = await this.fetchProjects();
		if (projects) {
			if (!projects.length && !this.noProjectMessageDisplayed && ConnectionHandler.isConnected) {
				commands.executeCommand(
					vsCommands.showErrorMessage,
					translate().t("errors.noProjectsFound")
				);
				this.noProjectMessageDisplayed = true;
			}
			if (!isEqual(projects, this.projects)) {
				this.projects = projects;
				this.view.refresh(this.projects);
			}
		}
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
