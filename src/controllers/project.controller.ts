import { Project } from "@ak-proto-ts/projects/v1/project_pb";
import { MessageType } from "@enums";
import { translate } from "@i18n";
import { IProjectView } from "@interfaces";
import { DeploymentsService, ProjectsService, SessionsService } from "@services";
import { Deployment } from "@type/models/deployment.type";
import { Session } from "@type/models/session.type";
import { MessageHandler } from "@views";
import isEqual from "lodash/isEqual";

export class ProjectController {
	private view: IProjectView;
	private intervalTimerId?: NodeJS.Timer;
	private disposeCB?: ProjectCB;
	private projectId: string;
	private project?: Project;
	private deployments: Deployment[] = [];
	private sessions?: Session[];
	private refreshRate: number;
	private buildIds: string[] = [];

	constructor(projectView: IProjectView, projectId: string, refreshRate: number) {
		this.view = projectView;
		this.projectId = projectId;
		this.view.delegate = this;
		this.refreshRate = refreshRate;
	}

	reveal(): void {
		this.view.reveal();
	}

	async getProjectDeployments(): Promise<Deployment[]> {
		const deployments = await DeploymentsService.listByBuildIds(this.buildIds);

		return deployments;
	}

	async refreshDeploymentsView() {
		const deployments = await this.getProjectDeployments();
		if (!isEqual(this.deployments, deployments)) {
			this.deployments = deployments;
			this.view.update({ type: MessageType.setDeployments, payload: deployments });
		}
	}

	startInterval() {
		if (!this.intervalTimerId) {
			this.intervalTimerId = setInterval(() => this.refreshDeploymentsView(), this.refreshRate);
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
		if (buildId) {
			MessageHandler.infoMessage(translate().t("projects.projectBuildSucceed"));
		}
	}

	async run() {
		const projectRunParams = await ProjectsService.run(this.projectId);
		if (projectRunParams?.deploymentId && projectRunParams?.buildId) {
			MessageHandler.infoMessage(translate().t("projects.projectDeploySucceed"));
			this.buildIds.push(projectRunParams.buildId);
		}
	}
}
