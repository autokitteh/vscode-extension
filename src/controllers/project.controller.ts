import { Deployment } from "@ak-proto-ts/deployments/v1/deployment_pb";
import { Project } from "@ak-proto-ts/projects/v1/project_pb";
import { Session } from "@ak-proto-ts/sessions/v1/session_pb";
import { DEFAULT_PROJECT_VIEW_REFRESH_INTERVAL } from "@constants";
import { ResponseHandler } from "@controllers/utilities/responseHandler";
import { translate } from "@i18n";
import { IProjectView } from "@interfaces";
import {
	EnvironmentsService,
	DeploymentsService,
	ProjectsService,
	SessionsService,
} from "@services";
import { MessageType } from "@type";
import { getIds } from "@utilities/getIds.utils";
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
	private sessions?: Session[];
	private refreshRate: number;

	constructor(projectView: IProjectView, projectId: string, refreshRate: number) {
		this.view = projectView;
		this.projectId = projectId;
		this.view.delegate = this;
		this.refreshRate = refreshRate;
	}

	reveal(): void {
		this.view.reveal();
	}

	async getProjectDeployments(): Promise<Deployment[] | undefined> {
		const environments = await ResponseHandler.handleServiceResponse(
			EnvironmentsService.listByProjectId(this.projectId),
			undefined,
			translate().t("errors.environmentsNotDefinedForProject")
		);
		if (!environments) {
			return;
		}
		const environmentIds = getIds(environments, "envId");
		const projectDeployments = await ResponseHandler.handleServiceResponse(
			DeploymentsService.listByEnvironmentIds(environmentIds),
			undefined,
			translate().t("errors.environmentsNotDefinedForProject")
		);
		return projectDeployments;
	}

	async refreshView() {
		const deployments = await this.getProjectDeployments();
		if (!isEqual(this.deployments, deployments)) {
			this.deployments = deployments;
			this.view.update({ type: MessageType.setDeployments, payload: deployments });
		}
		const sessions = await ResponseHandler.handleServiceResponse(
			SessionsService.listByProjectId(this.projectId),
			undefined,
			translate().t("errors.unexpectedError")
		);
		if (!isEqual(this.sessions, sessions)) {
			this.sessions = sessions;
			this.view.update({ type: MessageType.setSessions, payload: sessions });
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
		const project = await ResponseHandler.handleServiceResponse(
			ProjectsService.get(this.projectId),
			undefined,
			translate().t("errors.unexpectedError")
		);
		if (project) {
			this.project = project;
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
		await ResponseHandler.handleServiceResponse(
			ProjectsService.build(this.projectId),
			translate().t("projects.projectBuildSucceed"),
			translate().t("errors.unexpectedError")
		);
	}

	async run() {
		await ResponseHandler.handleServiceResponse(
			ProjectsService.run(this.projectId),
			translate().t("projects.projectDeploySucceed"),
			translate().t("errors.unexpectedError")
		);
	}
}
