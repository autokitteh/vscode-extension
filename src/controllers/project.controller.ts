import { vsCommands, namespaces, channels } from "@constants";
import { getResources } from "@controllers/utilities";
import { MessageType, ProjectIntervalTypes } from "@enums";
import { translate } from "@i18n";
import { IProjectView } from "@interfaces";
import { SessionLogRecord } from "@models";
import { DeploymentSectionViewModel, SessionSectionViewModel } from "@models/views";
import { DeploymentsService, ProjectsService, SessionsService, LoggerService } from "@services";
import { Callback } from "@type/interfaces";
import { Deployment, Project, Session } from "@type/models";
import isEqual from "lodash/isEqual";
import { commands, OpenDialogOptions, window } from "vscode";

export class ProjectController {
	private view: IProjectView;
	private intervalKeeper: Map<ProjectIntervalTypes, NodeJS.Timeout> = new Map();
	private disposeCB?: Callback<string>;
	public projectId: string;
	public project?: Project;
	private sessions?: Session[] = [];
	private sessionHistoryStates: SessionLogRecord[] = [];
	private deployments?: Deployment[];
	private deploymentsRefreshRate: number;
	private sessionsLogRefreshRate: number;
	private selectedDeploymentId?: string;
	private selectedSessionId?: string;
	private hasDisplayedError: Map<ProjectIntervalTypes, boolean> = new Map();
	private sessionSingleShotInputs: {
		deploymentId: string;
		sessionInputs: Record<string, any>;
		triggerFile: string;
		triggerFunction: string;
	} = {
		deploymentId: "",
		sessionInputs: {},
		triggerFile: "",
		triggerFunction: "",
	};

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
			const projectNotFoundMessage = translate().t("projects.projectNotFoundWithID", { id: this.projectId });
			commands.executeCommand(vsCommands.showErrorMessage, projectNotFoundMessage);
			LoggerService.error(namespaces.projectController, projectNotFoundMessage);
			return;
		}
		this.view.reveal(this.project.name);

		this.notifyViewResourcesPathChanged();
	}

	setProjectNameInView() {
		this.view.update({
			type: MessageType.setProjectName,
			payload: this.project?.name,
		});
	}

	public enable = async () => {
		this.setProjectNameInView();
		this.startInterval(
			ProjectIntervalTypes.deployments,
			() => this.loadAndDisplayDeployments(),
			this.deploymentsRefreshRate
		);
		this.notifyViewResourcesPathChanged();
		if (this.selectedSessionId) {
			this.startInterval(
				ProjectIntervalTypes.sessionHistory,
				() => this.displaySessionsHistory(this.selectedSessionId!),
				this.sessionsLogRefreshRate
			);
		}
	};

	public disable = async () => {
		this.stopInterval(ProjectIntervalTypes.deployments);
		this.stopInterval(ProjectIntervalTypes.sessionHistory);
		this.deployments = undefined;
		this.sessions = undefined;
		this.hasDisplayedError = new Map();
	};

	async loadAndDisplayDeployments() {
		const { data: deployments, error } = await DeploymentsService.listByProjectId(this.projectId);
		if (error) {
			const notification = translate().t("errors.noResponse");
			if (!this.hasDisplayedError.get(ProjectIntervalTypes.deployments)) {
				commands.executeCommand(vsCommands.showErrorMessage, notification);
				this.hasDisplayedError.set(ProjectIntervalTypes.deployments, true);
			}

			const log = `${translate().t("errors.deploymentsFetchFailed")} - ${(error as Error).message}`;
			LoggerService.error(namespaces.projectController, log);
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
		this.sessionSingleShotInputs.deploymentId = deploymentId;
		this.sessionSingleShotInputs.sessionInputs = {};

		const { data: sessions, error } = await SessionsService.listByDeploymentId(deploymentId);

		if (error) {
			const log = `${translate().t("errors.sessionFetchFailed")} - ${(error as Error).message}`;
			LoggerService.error(namespaces.projectController, log);
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
		const { data: sessionHistoryStates, error: sessionsError } =
			await SessionsService.getLogRecordsBySessionId(sessionId);

		if (sessionsError) {
			commands.executeCommand(vsCommands.showErrorMessage, (sessionsError as Error).message);
			LoggerService.error(namespaces.projectController, (sessionsError as Error).message);
			return;
		}
		if (!sessionHistoryStates?.length || !sessionHistoryStates) {
			LoggerService.sessionLog(translate().t("sessions.emptyHistory"));
			return;
		}

		if (isEqual(this.sessionHistoryStates, sessionHistoryStates)) {
			return;
		}

		LoggerService.clearOutputChannel(channels.appOutputSessionsLogName);
		this.outputSessionLogs(sessionHistoryStates);

		const lastState = sessionHistoryStates[sessionHistoryStates.length - 1];
		if (lastState.isFinished()) {
			if (lastState.isError()) {
				this.outputErrorDetails(lastState);
				this.outputCallstackDetails(lastState);
			}
			this.stopInterval(ProjectIntervalTypes.sessionHistory);
			return;
		}

		this.sessionHistoryStates = sessionHistoryStates;
	}

	private outputSessionLogs(sessionStates: SessionLogRecord[]) {
		const logPrefix = translate().t("sessions.logs");
		LoggerService.sessionLog(`${logPrefix}:`);

		const hasLogs = sessionStates.some((state) => state.getLogs());
		if (!hasLogs) {
			return;
		}
		for (let i = 0; i < sessionStates.length; i++) {
			if (!sessionStates[i].isFinished() && sessionStates[i].getLogs()) {
				LoggerService.sessionLog(`${sessionStates[i].dateTime?.toISOString()}\t${sessionStates[i].getLogs()}`);
			}
		}
	}

	private outputErrorDetails(state: SessionLogRecord) {
		LoggerService.sessionLog(`${translate().t("sessions.errors")}:`);
		const errorMessage = state.isError() ? state.getError() : "";
		LoggerService.sessionLog(`	${errorMessage}`);
	}

	private outputCallstackDetails(state: SessionLogRecord) {
		LoggerService.sessionLog(`${translate().t("sessions.callstack")}:`);
		if (!state.getCallstack().length) {
			return;
		}
		state.getCallstack().forEach(({ location: { col, name, path, row } }) => {
			LoggerService.sessionLog(`\t${path}: ${row}.${col}: ${name}`);
		});
	}

	async displaySessionLogs(sessionId: string): Promise<void> {
		this.stopInterval(ProjectIntervalTypes.sessionHistory);
		this.selectedSessionId = sessionId;

		this.startInterval(
			ProjectIntervalTypes.sessionHistory,
			() => this.displaySessionsHistory(sessionId),
			this.sessionsLogRefreshRate
		);
	}

	async startInterval(intervalKey: ProjectIntervalTypes, loadFunc: () => Promise<void> | void, refreshRate: number) {
		if (this.intervalKeeper.has(intervalKey)) {
			this.stopInterval(intervalKey);
		}
		await loadFunc();
		this.intervalKeeper.set(
			intervalKey,
			setInterval(() => loadFunc(), refreshRate)
		);
	}

	stopInterval(intervalKey: ProjectIntervalTypes) {
		clearInterval(this.intervalKeeper.get(intervalKey));
		this.intervalKeeper.delete(intervalKey);
	}

	public async openProject(disposeCB: Callback<string>) {
		this.disposeCB = disposeCB;
		const { data: project, error } = await ProjectsService.get(this.projectId);
		const log = translate().t("projects.projectNotFoundWithID", { id: this.projectId });
		if (error) {
			LoggerService.error(namespaces.projectController, (error as Error).message);
			commands.executeCommand(vsCommands.showErrorMessage, log);
			return;
		}
		if (project) {
			this.project = project;
			this.view.show(this.project.name);

			this.notifyViewResourcesPathChanged();

			this.startInterval(
				ProjectIntervalTypes.deployments,
				() => this.loadAndDisplayDeployments(),
				this.deploymentsRefreshRate
			);

			const entrypointsFromContext = (await commands.executeCommand(
				vsCommands.getContext,
				`${this.project.name}-entrypoints`
			)) as { entrypoints: Record<string, string[]> };

			if (entrypointsFromContext && entrypointsFromContext.entrypoints) {
				this.view.update({
					type: MessageType.setEntrypoints,
					payload: entrypointsFromContext.entrypoints,
				});
			}

			return;
		}
		LoggerService.error(namespaces.projectController, log);
	}

	onBlur() {
		this.disable();
	}

	onFocus() {
		this.enable();
	}

	onClose() {
		this.stopInterval(ProjectIntervalTypes.sessionHistory);
		this.stopInterval(ProjectIntervalTypes.deployments);
		this.disposeCB?.(this.projectId);
		this.hasDisplayedError = new Map();
	}

	async build() {
		const { data: mappedResources, error: resourcesError } = await getResources(this.projectId);
		if (resourcesError) {
			commands.executeCommand(vsCommands.showErrorMessage, (resourcesError as Error).message);
			LoggerService.error(namespaces.projectController, (resourcesError as Error).message);
			return;
		}
		const { data: buildId, error } = await ProjectsService.build(this.projectId, mappedResources!);
		if (error) {
			const notification = translate().t("projects.projectBuildFailed", {
				id: this.projectId,
			});
			const log = `${notification} - ${(error as Error).message}`;

			commands.executeCommand(vsCommands.showErrorMessage, notification);
			LoggerService.error(namespaces.projectController, log);
			return;
		}
		const successMessage = translate().t("projects.projectBuildSucceed", { id: buildId });
		commands.executeCommand(vsCommands.showInfoMessage, successMessage);

		LoggerService.info(namespaces.projectController, successMessage);
	}

	async onClickSetResourcesDirectory() {
		const options: OpenDialogOptions = {
			canSelectFiles: true,
			canSelectFolders: true,
			canSelectMany: false,
			openLabel: translate().t("resources.selectResourcesFolder"),
		};

		const uri = await window.showOpenDialog(options);
		if (!uri || uri.length === 0) {
			commands.executeCommand(vsCommands.showErrorMessage, translate().t("resources.setResourcesFailed"));
			return;
		}

		const resourcePath = uri[0].fsPath;
		await commands.executeCommand(vsCommands.setContext, this.projectId, { path: resourcePath });

		this.notifyViewResourcesPathChanged();
		return;
	}

	async run() {
		const { data: mappedResources, error: resourcesError } = await getResources(this.projectId);
		if (resourcesError) {
			commands.executeCommand(vsCommands.showErrorMessage, (resourcesError as Error).message);
			LoggerService.error(namespaces.projectController, (resourcesError as Error).message);
			return;
		}

		const { data: deploymentId, error } = await ProjectsService.run(this.projectId, mappedResources!);

		if (error) {
			const notification = translate().t("projects.projectDeployFailed", {
				id: this.projectId,
			});
			const log = `${notification} - ${(error as Error).message}`;
			LoggerService.error(namespaces.projectController, log);
			commands.executeCommand(vsCommands.showErrorMessage, notification);

			return;
		}

		const successMessage = translate().t("projects.projectDeploySucceed", { id: this.projectId });
		commands.executeCommand(vsCommands.showInfoMessage, successMessage);
		LoggerService.info(namespaces.projectController, successMessage);

		this.selectedDeploymentId = deploymentId;

		this.view.update({
			type: MessageType.selectDeployment,
			payload: deploymentId,
		});
	}

	async activateDeployment(deploymentId: string) {
		const { error } = await DeploymentsService.activate(deploymentId);

		if (error) {
			const notification = translate().t("deployments.activationFailed");
			const log = `${translate().t("deployments.activationFailedId", {
				id: deploymentId,
			})} - ${(error as Error).message}`;
			commands.executeCommand(vsCommands.showErrorMessage, notification);
			LoggerService.error(namespaces.projectController, log);
			return;
		}

		LoggerService.info(namespaces.projectController, translate().t("projects.activationSucceed", { id: deploymentId }));
	}

	async copyToClipboard(data: string) {
		const sessionInputs = this.sessions?.find((session) => session.sessionId === data)?.inputs;
		if (sessionInputs) {
			this.sessionSingleShotInputs.sessionInputs = sessionInputs;
			commands.executeCommand(vsCommands.showInfoMessage, translate().t("sessions.sessionParamsCopied"));

			this.view.update({
				type: MessageType.setSingleshotParams,
				payload: true,
			});
		}
	}

	async runSingleshot() {
		if (!this.selectedDeploymentId) {
			commands.executeCommand(vsCommands.showErrorMessage, translate().t("deployments.noSelectedDeployment"));
			return;
		}
		const { data: sessionId, error } = await SessionsService.runSingleshot(
			this.sessionSingleShotInputs.deploymentId,
			this.sessionSingleShotInputs.sessionInputs
		);

		if (error) {
			const notification = translate().t("sessions.singleShotFailed");
			const log = `${translate().t("sessions.singleShotFailedError", {
				error,
			})}`;
			commands.executeCommand(vsCommands.showErrorMessage, notification);
			LoggerService.error(namespaces.projectController, log);
			return;
		}
		const successMessage = translate().t("sessions.singleShotSucceed");
		commands.executeCommand(vsCommands.showInfoMessage, successMessage);
		LoggerService.info(namespaces.projectController, successMessage);

		this.stopInterval(ProjectIntervalTypes.sessionHistory);
		this.selectedSessionId = sessionId;

		this.startInterval(
			ProjectIntervalTypes.sessionHistory,
			() => this.displaySessionsHistory(sessionId!),
			this.sessionsLogRefreshRate
		);
	}

	async deactivateDeployment(deploymentId: string) {
		const { error } = await DeploymentsService.deactivate(deploymentId);

		if (error) {
			const notification = translate().t("deployments.deactivationFailed");
			const logMsg = translate().t("deployments.deactivationFailedId", {
				id: deploymentId,
			});
			const log = `${logMsg} - ${(error as Error).message}`;

			commands.executeCommand(vsCommands.showErrorMessage, notification);
			LoggerService.error(namespaces.projectController, log);
			return;
		}

		const successMessage = translate().t("deployments.deactivationSucceed");
		commands.executeCommand(vsCommands.showInfoMessage, successMessage);

		LoggerService.info(
			namespaces.projectController,
			translate().t("deployments.deactivationSucceedId", { id: deploymentId })
		);
	}

	async notifyViewResourcesPathChanged() {
		const resourcesPath = await this.getResourcesPath();

		if (resourcesPath) {
			this.view.update({
				type: MessageType.setResourcesDirState,
				payload: true,
			});
		} else {
			this.view.update({
				type: MessageType.setResourcesDirState,
				payload: false,
			});
		}
	}

	async getResourcesPath() {
		const projectFromContext: { path?: string } = await commands.executeCommand(vsCommands.getContext, this.projectId);
		return projectFromContext ? projectFromContext.path : undefined;
	}
}
