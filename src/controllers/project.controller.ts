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
			commands.executeCommand(vsCommands.showErrorMessage, translate().t("errors.projectNotFound"));
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
		const { data: deployments, error } = await await RequestHandler.handleServiceResponse(() =>
			DeploymentsService.listByProjectId(this.projectId)
		);
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

		const sessionsViewObject: SessionSectionViewModel = {
			sessions: this.sessions,
			totalSessions: this.sessions?.length || 0,
		};

		this.view.update({ type: MessageType.setSessionsSection, payload: sessionsViewObject });

		if (this.selectedDeploymentId) {
			await this.selectDeployment(this.selectedDeploymentId);
		}
	}

	async selectDeployment(deploymentId: string): Promise<void> {
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

		this.view.update({
			type: MessageType.selectDeployment,
			payload: deploymentId,
		});
	}

	async displaySessionsHistory(sessionId: string): Promise<void> {
		const { data: sessionHistoryStates, error } = await SessionsService.getHistoryBySessionId(sessionId);
		if (error || !sessionHistoryStates?.length) {
			return;
		}

		if (isEqual(this.sessionHistoryStates, sessionHistoryStates) && this.sessionHistoryStates?.length) {
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
			const printedError = lastState.getError();
			LoggerService.printError(namespaces.sessionLogs, printedError, channels.appOutputSessionsLogName);

			if (lastState.getCallstack().length) {
				LoggerService.printError(namespaces.sessionLogs, "Callstack:", channels.appOutputSessionsLogName);
				lastState.getCallstack().forEach((callstackObj) => {
					let { col, name, path, row } = callstackObj.location;
					const formatCallstackString = `${row}:${col} - ${path}: ${name}`;
					LoggerService.printError(namespaces.sessionLogs, formatCallstackString, channels.appOutputSessionsLogName);
				});
			}
			return;
		}

		lastState.getLogs().forEach((logStr) => {
			LoggerService.print(namespaces.sessionLogs, logStr, channels.appOutputSessionsLogName);
		});
	}

	async displaySessionLogs(sessionId: string): Promise<void> {
		this.startInterval(
			ProjectIntervals.sessions,
			() => this.displaySessionsHistory(sessionId),
			this.sessionsLogRefreshRate
		);
	}

	async startInterval(intervalKey: ProjectIntervals, loadFunc: () => Promise<void>, refreshRate: number) {
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
		const { data: project } = await RequestHandler.handleServiceResponse(() => ProjectsService.get(this.projectId), {
			formatFailureMessage: (): string => `${translate().t("projects.projectNotFound")}, Project ID: ${this.projectId}`,
		});
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
		this.setProjectNameInView();
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
			formatSuccessMessage: (data?: string): string => `${translate().t("projects.projectBuildSucceed", { id: data })}`,
			formatFailureMessage: (): string =>
				translate().t("projects.projectBuildFailed", {
					id: this.projectId,
				}),
		});
	}

	async run() {
		const { data: deploymentId } = await RequestHandler.handleServiceResponse(
			() => ProjectsService.run(this.projectId),
			{
				formatSuccessMessage: (): string => `${translate().t("projects.projectDeploySucceed", { id: this.projectId })}`,
				formatFailureMessage: (): string =>
					`${translate().t("projects.projectDeployFailed", {
						id: this.projectId,
					})}`,
			}
		);

		this.selectedDeploymentId = deploymentId;

		this.view.update({
			type: MessageType.selectDeployment,
			payload: deploymentId,
		});
	}

	async activateDeployment(deploymentId: string) {
		await RequestHandler.handleServiceResponse(() => DeploymentsService.activate(deploymentId), {
			formatSuccessMessage: (): string => `${translate().t("deployments.activationSucceed", { id: deploymentId })}`,
			formatFailureMessage: (): string =>
				`${translate().t("deployments.activationFailed", {
					id: deploymentId,
				})}`,
		});
	}

	async deactivateDeployment(deploymentId: string) {
		await RequestHandler.handleServiceResponse(() => DeploymentsService.deactivate(deploymentId), {
			formatSuccessMessage: (): string => `${translate().t("deployments.deactivationSucceed", { id: deploymentId })}`,
			formatFailureMessage: (): string =>
				`${translate().t("deployments.deactivationFailed", {
					id: deploymentId,
				})}`,
		});
	}
}
