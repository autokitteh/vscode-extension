import { Session } from "@ak-proto-ts/sessions/v1/session_pb";
import { RequestHandler } from "@controllers/utilities/requestHandler";
import { MessageType } from "@enums";
import { translate } from "@i18n";
import { IProjectView } from "@interfaces";
import {
	EnvironmentsService,
	DeploymentsService,
	ProjectsService,
	SessionsService,
} from "@services";
import { Deployment, Project } from "@type/models";
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
		const environments = await RequestHandler.handleServiceResponse(
			() => EnvironmentsService.listByProjectId(this.projectId),
			{ onFailureMessage: translate().t("errors.environmentsNotDefinedForProject") }
		);
		if (!environments || environments.length === 0) {
			MessageHandler.errorMessage(translate().t("errors.environmentsNotDefinedForProject"));
			return;
		}
		const environmentIds = getIds(environments, "envId");
		const projectDeployments = await RequestHandler.handleServiceResponse(
			() => DeploymentsService.listByEnvironmentIds(environmentIds),
			{ onFailureMessage: translate().t("errors.deploymentsNotDefinedForProject") }
		);
		return projectDeployments;
	}

	async refreshView() {
		const deployments = await this.getProjectDeployments();
		if (!isEqual(this.deployments, deployments)) {
			this.deployments = deployments;
			this.view.update({ type: MessageType.setDeployments, payload: deployments });
		}
		const sessions = await RequestHandler.handleServiceResponse(() =>
			SessionsService.listByProjectId(this.projectId)
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
		const project = await RequestHandler.handleServiceResponse(
			() => ProjectsService.get(this.projectId),
			{
				onFailureMessage: translate().t("errors.projectNotFound"),
			}
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
		await RequestHandler.handleServiceResponse(() => ProjectsService.build(this.projectId), {
			onSuccessMessage: translate().t("projects.projectBuildSucceed"),
			onFailureMessage: translate().t("projects.projectBuildFailed"),
		});
	}

	async run() {
		await RequestHandler.handleServiceResponse(() => ProjectsService.run(this.projectId), {
			onSuccessMessage: translate().t("projects.projectDeploySucceed"),
			onFailureMessage: translate().t("projects.projectDeployFailed"),
		});
	}
}
