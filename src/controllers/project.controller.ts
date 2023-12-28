import { Deployment } from "@ak-proto-ts/deployments/v1/deployment_pb";
import { Project } from "@ak-proto-ts/projects/v1/project_pb";
import { MessageType } from "@enums";
import { translate } from "@i18n";
import { IProjectView } from "@interfaces";
import { DeploymentsService, ProjectsService, SessionsService } from "@services";
import { DeploymentType } from "@type/models/deployment.type";
import { SessionType } from "@type/models/session.type";
import { getIds } from "@utilities/getIds.utils";
import { MessageHandler } from "@views";
import isEqual from "lodash/isEqual";

export class ProjectController {
	private view: IProjectView;
	private intervalTimerId?: NodeJS.Timer;
	private disposeCB?: ProjectCB;
	public projectId: string;
	public project?: Project;
	private deployments?: Deployment[];
	private sessions?: SessionType[];
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

	async getProjectDeployments(): Promise<DeploymentType[]> {
		const deployments = await DeploymentsService.listByBuildIds(this.buildIds);

		return deployments;
	}

	async refreshView() {
		const deployments = await this.getProjectDeployments();
		if (!isEqual(this.deployments, deployments)) {
			// this.deployments = deployments;
			// this.view.update({ type: MessageType.setDeployments, payload: deployments });
		}
		// const sessions = await SessionsService.listByDeploymentId(this.deployments![0].deploymentId);
		// console.log(sessions);

		// if (!isEqual(this.sessions, sessions)) {
		// 	this.sessions = sessions;
		// 	this.view.update({ type: MessageType.setSessions, payload: sessions });
		// }
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
