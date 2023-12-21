import { Deployment } from "@ak-proto-ts/deployments/v1/deployment_pb";
import { Project } from "@ak-proto-ts/projects/v1/project_pb";
import { DEFAULT_PROJECT_VIEW_REFRESH_INTERVAL } from "@constants";
import { translate } from "@i18n";
import { IProjectView } from "@interfaces";
import { EnvironmentsService, DeploymentsService, ProjectsService } from "@services";
import { MessageType } from "@type";
import { getIds } from "@utilities/getIds";
import { MessageHandler } from "@views";
import isEqual from "lodash/isEqual";
import { workspace } from "vscode";

export class ProjectController {
	private view: IProjectView;
	private intervalTimerId?: NodeJS.Timer;
	private disposeCB?: ProjectCB;
	public projectId: string;
	public project?: Project;
	private deployments?: Deployment[];
	private refreshRate: number;

	constructor(projectView: IProjectView, projectId: string) {
		this.view = projectView;
		this.projectId = projectId;
		this.view.delegate = this;
		this.refreshRate = workspace //consider pass from outside in order to test easier
			.getConfiguration()
			.get("autokitteh.project.refresh.interval", DEFAULT_PROJECT_VIEW_REFRESH_INTERVAL);
	}

	reveal(): void {
		this.view.reveal();
	}

	async getProjectDeployments(): Promise<Deployment[]> {
		const environments = await EnvironmentsService.getByProject(this.projectId);
		if (!environments.length) {
			MessageHandler.errorMessage(translate().t("errors.environmentsNotDefinedForProject"));
			return [];
		}

		return await DeploymentsService.listForEnvironments(getIds(environments, "envId"));
	}

	async refreshView() {
		const deployments = await this.getProjectDeployments();
		if (!isEqual(this.deployments, deployments)) {
			this.deployments = deployments;
			this.view.update({ type: MessageType.deployments, payload: deployments });
		}
	}

	startInterval() {
		if (!this.intervalTimerId) {
			this.intervalTimerId = setInterval(() => this.refreshView(), this.refreshRate);
		}
	}

	stopInterval() {
		if (this.intervalTimerId) {
			clearInterval(this.intervalTimerId);
			this.intervalTimerId = undefined;
		}
	}

	public async openProject(disposeCB: ProjectCB) {
		this.disposeCB = disposeCB;
		this.project = await ProjectsService.get(this.projectId);
		if (this.project) {
			this.view.show(this.project.name);
			this.startInterval();
		}
	}

	onBlur() {
		this.stopInterval();
	}

	onFocus() {
		this.startInterval();
	}

	onClose() {
		this.stopInterval();
		this.disposeCB?.(this.projectId);
	}

	async build() {
		const buildId = await ProjectsService.build(this.projectId);
	}

	deploy() {}
}
