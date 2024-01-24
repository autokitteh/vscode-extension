import { vsCommands, namespaces, channels } from "@constants";
import { RequestHandler } from "@controllers/utilities/requestHandler";
import { MessageType } from "@enums";
import { ProjectIntervals } from "@enums";
import { translate } from "@i18n";
import { IProjectView } from "@interfaces";
import { SessionState } from "@models";
import { DeploymentSectionViewModel, SessionSectionViewModel } from "@models/views";
import { DeploymentsService, ProjectsService, SessionsService, LoggerService } from "@services";
import { Callback } from "@type/interfaces";
import { Deployment, Project, Session } from "@type/models";
import isEqual from "lodash/isEqual";
import { commands } from "vscode";

export class ProjectController {
	private view: IProjectView;
	private intervalKeeper: Map<ProjectIntervals, NodeJS.Timeout> = new Map();
	private disposeCB?: Callback<string>;
	public projectId: string;
	public project?: Project;
	private sessions?: Session[] = [];
	private sessionHistoryStates?: SessionState[] = [];
	private deployments?: Deployment[];
	private deploymentsRefreshRate: number;
	private sessionsLogRefreshRate: number;
	private selectedDeploymentId?: string;

	constructor(
		projectView: IProjectView,
		projectId: string,
		deploymentsRefreshRate: number,
		sessionsLogRefreshRate: number
	) {
		this.view = projectView;
		this.projectId = projectId;
		this.view.delegate = this;
		this.deploymentsRefreshRate = deploymentsRefreshRate;
		this.sessionsLogRefreshRate = sessionsLogRefreshRate;
		this.setProjectNameInView();
	}

	reveal(): void {
		if (!this.project) {
			commands.executeCommand(vsCommands.showErrorMessage, translate().t("errors.unexpectedError"));
			return;
		}
		this.view.reveal(this.project.name);
	}

	setProjectNameInView() {
		this.view.update({
			type: MessageType.setProjectName,
			payload: this.project?.name,
		});
	}

	async loadAndDisplayDeployments() {
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

		this.view.update({ type: MessageType.setSessionsSection, payload: undefined });

		if (this.selectedDeploymentId) {
			await this.selectDeployment(this.selectedDeploymentId);
		}
	}

	async selectDeployment(deploymentId?: string): Promise<void> {
		this.selectedDeploymentId = deploymentId;
		if (!deploymentId) {
			return;
		}
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

	async displaySessionsHistory(sessionId?: string): Promise<void> {
		if (!sessionId) {
			return;
		}
		const { data: sessionHistoryStates, error } =
			await SessionsService.getHistoryBySessionId(sessionId);
		if (error || !sessionHistoryStates?.length) {
			return;
		}

		if (
			isEqual(this.sessionHistoryStates, sessionHistoryStates) &&
			this.sessionHistoryStates?.length
		) {
			return;
		}
		this.sessionHistoryStates = sessionHistoryStates;

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

	async displaySessionLogs(sessionId?: string): Promise<void> {
		this.startInterval(
			ProjectIntervals.sessions,
			() => this.displaySessionsHistory(sessionId),
			this.sessionsLogRefreshRate
		);
	}

	async startInterval(
		intervalKey: ProjectIntervals,
		loadFunc: () => Promise<void>,
		refreshRate: number
	) {
		if (this.intervalKeeper.has(intervalKey)) {
			this.stopInterval(intervalKey);
		}
		await loadFunc();
		this.intervalKeeper.set(
			intervalKey,
			setInterval(() => loadFunc(), refreshRate)
		);
	}

	stopInterval(intervalKey: ProjectIntervals) {
		clearInterval(this.intervalKeeper.get(intervalKey));
		this.intervalKeeper.delete(intervalKey);
	}

	public async openProject(disposeCB: Callback<string>) {
		this.disposeCB = disposeCB;
		const { data: project } = await RequestHandler.handleServiceResponse(
			() => ProjectsService.get(this.projectId),
			{
				onFailureMessageKey: translate().t("errors.projectNotFound"),
			}
		);
		if (project) {
			this.project = project;
			this.view.show(this.project.name);
			this.startInterval(
				ProjectIntervals.deployments,
				() => this.loadAndDisplayDeployments(),
				this.deploymentsRefreshRate
			);
		}
	}

	onBlur() {
		this.stopInterval(ProjectIntervals.deployments);
		this.stopInterval(ProjectIntervals.sessions);
		this.deployments = undefined;
		this.sessions = undefined;
	}

	onFocus() {
		this.startInterval(
			ProjectIntervals.deployments,
			() => this.loadAndDisplayDeployments(),
			this.deploymentsRefreshRate
		);
	}

	onClose() {
		this.stopInterval(ProjectIntervals.sessions);
		this.stopInterval(ProjectIntervals.deployments);
		this.disposeCB?.(this.projectId);
	}

	async build() {
		await RequestHandler.handleServiceResponse(() => ProjectsService.build(this.projectId), {
			onSuccessMessageKey: "projects.projectBuildSucceed",
			onFailureMessageKey: "projects.projectBuildFailed",
		});
	}

	async run() {
		const { data: deploymentId } = await RequestHandler.handleServiceResponse(
			() => ProjectsService.run(this.projectId),
			{
				onSuccessMessageKey: translate().t("projects.projectDeploySucceed"),
				onFailureMessageKey: translate().t("projects.projectDeployFailed"),
			}
		);

		this.selectedDeploymentId = deploymentId;

		this.view.update({
			type: MessageType.selectDeployment,
			payload: deploymentId,
		});
	}

	async activateDeployment(deploymentId?: string) {
		if (!deploymentId) {
			return;
		}
		await RequestHandler.handleServiceResponse(() => DeploymentsService.activate(deploymentId), {
			onSuccessMessageKey: "deployments.activationSucceed",
			onFailureMessageKey: "deployments.activationFailed",
		});
	}

	async deactivateDeployment(deploymentId?: string) {
		if (!deploymentId) {
			return;
		}
		await RequestHandler.handleServiceResponse(() => DeploymentsService.deactivate(deploymentId), {
			onSuccessMessageKey: "deployments.deactivationSucceed",
			onFailureMessageKey: "deployments.deactivationFailed",
		});
	}
}
