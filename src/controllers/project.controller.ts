import { vsCommands, namespaces, channels } from "@constants";
import { RequestHandler } from "@controllers/utilities/requestHandler";
import { MessageType } from "@enums";
import { translate } from "@i18n";
import { IProjectView } from "@interfaces";
import { DeploymentSectionViewModel, SessionSectionViewModel } from "@models/views";
import { DeploymentsService, ProjectsService, SessionsService, LoggerService } from "@services";
import { ProjectCB } from "@type/interfaces";
import { Deployment, Project, Session } from "@type/models";
import isEqual from "lodash/isEqual";
import { commands } from "vscode";

export class ProjectController {
	private view: IProjectView;
	private intervalTimerId?: NodeJS.Timeout;
	private disposeCB?: ProjectCB;
	public projectId: string;
	public project?: Project;
	private sessions?: Session[] = [];
	private deployments?: Deployment[];
	private refreshRate: number;
	private selectedDeploymentId?: string;

	constructor(projectView: IProjectView, projectId: string, refreshRate: number) {
		this.view = projectView;
		this.projectId = projectId;
		this.view.delegate = this;
		this.refreshRate = refreshRate;
	}

	reveal(): void {
		if (!this.project) {
			commands.executeCommand(vsCommands.showErrorMessage, translate().t("errors.unexpectedError"));
			return;
		}
		this.view.reveal(this.project.name);
	}

	async loadDeployments() {
		const { data: deployments, error } = await DeploymentsService.listByProjectId(this.projectId);
		if (error) {
			commands.executeCommand(vsCommands.showErrorMessage, error as string);

			return;
		}
		if (isEqual(this.deployments, deployments)) {
			return;
		}
		this.deployments = deployments;
		const deploymentsViewObject: DeploymentSectionViewModel = {
			deployments,
			totalDeployments: deployments?.length || 0,
		};

		this.view.update({
			type: MessageType.setDeployments,
			payload: deploymentsViewObject,
		});
	}

	async refreshView() {
		await this.loadDeployments();
		if (this.selectedDeploymentId) {
			await this.selectDeployment(this.selectedDeploymentId);
		}
	}

	async selectDeployment(deploymentId: string) {
		this.selectedDeploymentId = deploymentId;
		const { data: sessions, error } = await RequestHandler.handleServiceResponse(() =>
			SessionsService.listByDeploymentId(deploymentId)
		);
		if (error) {
			return;
		}

		if (isEqual(this.sessions, sessions) && this.sessions?.length) {
			return;
		}

		this.sessions = sessions;
		const sessionsViewObject: SessionSectionViewModel = {
			sessions,
			totalSessions: sessions?.length || 0,
		};

		this.view.update({
			type: MessageType.setSessionsSection,
			payload: sessionsViewObject,
		});
	}

	async displaySessionLogs(sessionId: string) {
		const { data: sessionHistoryStates, error } =
			await SessionsService.getHistoryBySessionId(sessionId);
		if (error || !sessionHistoryStates?.length) {
			return;
		}

		LoggerService.clearOutputChannel(channels.appOutputSessionsLogName);

		const lastState = sessionHistoryStates[sessionHistoryStates.length - 1];

		if (!lastState.containLogs() && !lastState.isError()) {
			LoggerService.printError(
				namespaces.sessionLogs,
				translate().t("sessions.noLogs"),
				channels.appOutputSessionsLogName
			);

			return;
		}

		if (lastState.isError()) {
			const printedError = lastState?.getError() || translate().t("errors.unexpectedError");
			LoggerService.printError(
				namespaces.sessionLogs,
				printedError,
				channels.appOutputSessionsLogName
			);
			return;
		}

		lastState.getLogs().forEach((logStr) => {
			LoggerService.print(namespaces.sessionLogs, logStr, channels.appOutputSessionsLogName);
		});
	}

	async startInterval() {
		if (!this.intervalTimerId) {
			await this.loadDeployments();
			this.view.update({ type: MessageType.setSessionsSection, payload: undefined });
			this.view.update({
				type: MessageType.setProjectName,
				payload: this.project?.name,
			});

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
		const { data: project } = await RequestHandler.handleServiceResponse(
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
		this.deployments = undefined;
		this.sessions = undefined;
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
