import { RequestHandler } from "@controllers/utilities/requestHandler";
import { translate } from "@i18n";
import { ProjectsService } from "@services";
import { SidebarTreeItem } from "@type/views";
import { ISidebarView } from "interfaces";
import isEqual from "lodash/isEqual";
import { window } from "vscode";

export class SidebarController {
	private view: ISidebarView;
	private intervalTimerId?: NodeJS.Timeout;
	private refreshRate: number;
	private projects?: SidebarTreeItem[];
	private noProjectMessageDisplayed = false;
	private connectionErrorDisplayed = false;

	constructor(sidebarView: ISidebarView, refreshRate: number) {
		this.view = sidebarView;
		window.registerTreeDataProvider("autokittehSidebarTree", this.view);
		this.refreshRate = refreshRate;
		this.connectionErrorDisplayed = false;
	}

	public connect = async () => {
		this.refreshProjects();

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
		return;
	};

	private startInterval() {
		this.noProjectMessageDisplayed = false;
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
		await RequestHandler.handleServiceResponse(() => ProjectsService.build(projectId), {
			onSuccessMessageKey: "projects.projectBuildSucceed",
			onFailureMessageKey: "projects.projectBuildFailed",
		});
	}

	async runProject(projectId: string) {
		await RequestHandler.handleServiceResponse(() => ProjectsService.run(projectId), {
			onSuccessMessageKey: "projects.projectDeploySucceed",
			onFailureMessageKey: "projects.projectDeployFailed",
		});
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
