import * as fs from "fs";
import * as fsPromises from "fs/promises";
import * as path from "path";
import { vsCommands, namespaces, channels, BASE_URL, INITIAL_RETRY_SCHEDULE_COUNTDOWN } from "@constants";
import { convertBuildRuntimesToViewTriggers, getLocalResources } from "@controllers/utilities";
import { RetryScheduler } from "@controllers/utilities/retryScheduler.util";
import {
	DeploymentState,
	MessageType,
	ProjectIntervalTypes,
	ProjectRecurringErrorMessages,
	SessionStateType,
} from "@enums";
import { translate } from "@i18n";
import { IProjectView } from "@interfaces";
import { DeploymentSectionViewModel, SessionLogRecord, SessionSectionViewModel } from "@models";
import { reverseSessionStateConverter } from "@models/utils";
import { DeploymentsService, ProjectsService, SessionsService, LoggerService, ConnectionsService } from "@services";
import { BuildsService } from "@services";
import { StartSessionArgsType } from "@type";
import { Callback } from "@type/interfaces";
import { Connection, Deployment, Project, Session } from "@type/models";
import { createDirectory, openFileExplorer } from "@utilities";
import isEqual from "lodash.isequal";
import { commands, OpenDialogOptions, window, env, Uri } from "vscode";

export class ProjectController {
	private view: IProjectView;
	private intervalKeeper: Map<ProjectIntervalTypes, NodeJS.Timeout> = new Map();
	private onProjectDisposeCB?: Callback<string>;
	private onProjectDeleteCB?: Callback<string>;
	public projectId: string;
	public project?: Project;
	private sessions?: Session[] = [];
	private sessionHistoryStates: SessionLogRecord[] = [];
	private cachedSessionHistoryStates: Map<string, SessionLogRecord[]> = new Map();
	private sessionLogOutputCursor: number = 0;
	private deployments?: Deployment[];
	private deploymentsRefreshRate: number;
	private sessionsLogRefreshRate: number;
	private selectedDeploymentId?: string;
	private isDeploymentLiveTailPossible?: boolean;
	private filterSessionsState?: string;
	private hasDisplayedError: Map<ProjectRecurringErrorMessages, boolean> = new Map();
	private selectedSessionPerDeployment: Map<string, string> = new Map();
	private loadingRequestsCounter: number = 0;
	private sessionsNextPageToken?: string;
	private deploymentsWithLiveTail: Map<string, boolean> = new Map();
	private retryScheduler?: RetryScheduler;
	private connections?: Connection[];

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
	}

	private updateViewWithCountdown(countdown: string) {
		this.deployments = undefined;
		this.view.update({
			type: MessageType.setRetryCountdown,
			payload: countdown,
		});
	}

	reveal(): void {
		this.startLoader();
		if (!this.project) {
			const projectNotFoundMessage = translate().t("projects.projectNotFoundWithID", { id: this.projectId });
			commands.executeCommand(vsCommands.showErrorMessage, projectNotFoundMessage);
			LoggerService.error(namespaces.projectController, projectNotFoundMessage);
			return;
		}
		this.view.reveal(this.project.name);

		this.notifyViewResourcesPathChanged();
		this.stopLoader();
	}

	setProjectNameInView() {
		this.startLoader();
		this.view.update({
			type: MessageType.setProjectName,
			payload: this.project?.name,
		});
		this.stopLoader();
	}

	async deleteProject() {
		this.startLoader();
		const { error } = await ProjectsService.delete(this.projectId);
		this.stopLoader();

		if (error) {
			const notification = translate().t("projects.deleteFailed", { projectName: this.project?.name });
			const log = translate().t("projects.deleteFailedError", { projectName: this.project?.name, error });
			commands.executeCommand(vsCommands.showErrorMessage, notification);
			LoggerService.error(namespaces.projectController, log);
			return;
		}
		const successMessage = translate().t("projects.deleteSucceed", { projectName: this.project?.name });
		commands.executeCommand(vsCommands.showInfoMessage, successMessage);
		LoggerService.info(namespaces.projectController, successMessage);
		this.onProjectDeleteCB?.(this.projectId);
	}

	async getSessionHistory(sessionId: string) {
		this.startLoader();
		const { data: sessionHistoryStates, error: sessionsError } =
			await SessionsService.getLogRecordsBySessionId(sessionId);
		this.stopLoader();

		if (sessionsError) {
			if (!this.hasDisplayedError.get(ProjectRecurringErrorMessages.sessionHistory)) {
				const notificationErrorMessage = translate().t("errors.sessionLogRecordFetchFailedShort", {
					deploymentId: this.selectedDeploymentId,
				});
				commands.executeCommand(vsCommands.showErrorMessage, notificationErrorMessage);
				this.hasDisplayedError.set(ProjectRecurringErrorMessages.sessionHistory, true);
			}

			const logErrorMessage = translate().t("errors.sessionLogRecordFetchFailed", {
				deploymentId: this.selectedDeploymentId,
				error: (sessionsError as Error).message,
			});
			LoggerService.error(namespaces.projectController, logErrorMessage);
			return;
		}
		if (!sessionHistoryStates?.length || !sessionHistoryStates) {
			LoggerService.sessionLog(translate().t("sessions.emptyHistory"));
			return;
		}
		return sessionHistoryStates;
	}

	public enable = async () => {
		this.setProjectNameInView();
		this.notifyViewResourcesPathChanged();

		this.sessions = undefined;
		await this.fetchSessions();

		if (!this.selectedDeploymentId) {
			return;
		}
		const selectedSessionId = this.selectedSessionPerDeployment.get(this.selectedDeploymentId);

		this.initSessionLogsDisplay(selectedSessionId!);
	};

	public reconnect = async () => {
		this.deployments = undefined;
		this.loadAndDisplayDeployments(false);
	};

	public disable = async () => {
		this.stopInterval(ProjectIntervalTypes.deployments);
		this.stopInterval(ProjectIntervalTypes.project);
		this.stopInterval(ProjectIntervalTypes.sessionHistory);
		this.deployments = undefined;
		this.sessions = undefined;
		this.hasDisplayedError = new Map();
	};

	public tryToReenable = async () => {
		this.reconnect();
		commands.executeCommand(vsCommands.reconnectSidebar);
	};

	async loadAndDisplayDeployments(isResetCounters: boolean = true) {
		this.startLoader();
		const { data: deployments, error } = await DeploymentsService.listByProjectId(this.projectId);
		this.stopLoader();

		if (error) {
			const notification = translate().t("errors.noResponse");
			if (!this.hasDisplayedError.get(ProjectRecurringErrorMessages.deployments)) {
				commands.executeCommand(vsCommands.showErrorMessage, notification);
				this.hasDisplayedError.set(ProjectRecurringErrorMessages.deployments, true);
			}

			const log = `${translate().t("errors.deploymentsFetchFailed")} - ${(error as Error).message}`;
			LoggerService.error(namespaces.projectController, log);
			if (isResetCounters) {
				this.retryScheduler?.startCountdown();
			}
			return;
		}

		this.view.update({
			type: MessageType.setRetryCountdown,
			payload: "",
		});

		this.retryScheduler?.resetCountdown();

		if (isEqual(this.deployments, deployments)) {
			return;
		}

		this.deployments = deployments;
		this.loadSingleshotArgs();

		const deploymentsViewObject: DeploymentSectionViewModel = {
			deployments,
			totalDeployments: deployments?.length || 0,
			selectedDeploymentId: this.selectedDeploymentId,
		};

		this.view.update({
			type: MessageType.setDeployments,
			payload: deploymentsViewObject,
		});

		if (!this.selectedDeploymentId) {
			return;
		}

		const isLiveStateOn = this.deploymentsWithLiveTail.get(this.selectedDeploymentId);
		if (!isLiveStateOn) {
			return;
		}
		await this.selectDeployment(this.selectedDeploymentId);
	}

	startLoader() {
		this.loadingRequestsCounter++;
		if (this.loadingRequestsCounter < 0) {
			LoggerService.error(namespaces.projectController, translate().t("errors.loadingCounterStartFailure"));
			this.loadingRequestsCounter = 1;
		}

		this.view.update({
			type: MessageType.startLoader,
		});
	}

	stopLoader() {
		this.loadingRequestsCounter--;
		if (this.loadingRequestsCounter < 0) {
			LoggerService.error(namespaces.projectController, translate().t("errors.loadingCounterStopFailure"));
			this.loadingRequestsCounter = 0;
		}

		this.view.update({
			type: MessageType.stopLoader,
		});
	}

	async loadSingleshotArgs() {
		const lastDeployment = this.deployments ? this.deployments[this.deployments?.length - 1] : null;

		if (!lastDeployment) {
			return;
		}

		this.startLoader();
		const { data: buildDescription, error: buildDescriptionError } = await BuildsService.getBuildDescription(
			lastDeployment.buildId
		);
		this.stopLoader();

		if (buildDescriptionError) {
			LoggerService.error(namespaces.projectController, translate().t("errors.buildInformationForSingleshotNotLoaded"));
			return;
		}
		let buildInfo;
		try {
			buildInfo = JSON.parse(buildDescription!);
		} catch (error) {
			LoggerService.error(namespaces.projectController, translate().t("errors.buildInformationForSingleshotNotParsed"));
			return;
		}
		this.view.update({
			type: MessageType.setEntrypoints,
			payload: convertBuildRuntimesToViewTriggers(buildInfo.runtimes),
		});
	}

	async setSessionsStateFilter(filterState: string) {
		if (this.filterSessionsState === filterState) {
			return;
		}
		this.filterSessionsState = filterState;
		LoggerService.clearOutputChannel(channels.appOutputSessionsLogName);
		await this.fetchSessions();
	}

	async fetchSessions() {
		if (!this.selectedDeploymentId) {
			return;
		}

		const selectedSessionStateFilter = reverseSessionStateConverter(this.filterSessionsState as SessionStateType);

		this.startLoader();
		const { data, error } = await SessionsService.listByDeploymentId(this.selectedDeploymentId, {
			stateType: selectedSessionStateFilter,
		});
		this.stopLoader();

		if (error) {
			if (!this.hasDisplayedError.get(ProjectRecurringErrorMessages.sessions)) {
				commands.executeCommand(vsCommands.showErrorMessage, translate().t("errors.internalErrorUpdate"));
				this.hasDisplayedError.set(ProjectRecurringErrorMessages.sessions, true);
			}

			const log = `${translate().t("errors.sessionFetchFailed")} - ${(error as Error).message}`;
			LoggerService.error(namespaces.projectController, log);
			return;
		}

		const { sessions, nextPageToken } = data!;

		if (isEqual(this.sessions, sessions)) {
			return;
		}

		this.sessions = sessions;
		this.sessionsNextPageToken = nextPageToken;

		const sessionsViewObject: SessionSectionViewModel = {
			sessions,
			showLiveTail: this.isDeploymentLiveTailPossible!,
			lastDeployment: this.deployments ? this.deployments[0] : undefined,
		};

		this.view.update({
			type: MessageType.setSessionsSection,
			payload: sessionsViewObject,
		});

		if (!sessions?.length) {
			return;
		}

		const selectedSessionId = this.selectedSessionPerDeployment.get(this.selectedDeploymentId);

		if (!selectedSessionId) {
			return;
		}

		const isCurrentSelectedSessionDisplayed =
			sessions.findIndex((session) => session.sessionId === selectedSessionId) !== -1;
		if (!isCurrentSelectedSessionDisplayed) {
			return;
		}

		this.view.update({
			type: MessageType.selectSession,
			payload: selectedSessionId,
		});
		this.displaySessionLogs(selectedSessionId);
	}

	async selectDeployment(deploymentId: string): Promise<void> {
		this.selectedDeploymentId = deploymentId;

		const selectedDeploymentState = this.deployments?.find(
			(deployment) => deployment.deploymentId === this.selectedDeploymentId
		)?.state;
		const selectedDeploymentActive = selectedDeploymentState === DeploymentState.ACTIVE_DEPLOYMENT;
		const selectedDeploymentDraining = selectedDeploymentState === DeploymentState.DRAINING_DEPLOYMENT;
		this.isDeploymentLiveTailPossible = selectedDeploymentActive || selectedDeploymentDraining;

		const existingLiveTailState = this.deploymentsWithLiveTail.has(deploymentId);
		const isFirstTime = !existingLiveTailState;
		let isLiveStateOn = this.deploymentsWithLiveTail.get(deploymentId);
		if (isFirstTime && this.isDeploymentLiveTailPossible) {
			isLiveStateOn = true;
			this.deploymentsWithLiveTail.set(deploymentId, true);
		}
		if (isFirstTime || isLiveStateOn || (!isLiveStateOn && !this.isDeploymentLiveTailPossible)) {
			await this.fetchSessions();
		}

		this.view.update({
			type: MessageType.selectDeployment,
			payload: this.selectedDeploymentId,
		});
	}

	printFinishedSessionLogs(lastState: SessionLogRecord) {
		if (lastState.isError()) {
			this.outputErrorDetails(lastState);
			this.outputCallstackDetails(lastState);
		}
		this.sessionLogOutputCursor = 0;

		this.stopInterval(ProjectIntervalTypes.sessionHistory);
	}

	async displaySessionsHistory(sessionId: string): Promise<void> {
		const sessionHistoryStates = await this.getSessionHistory(sessionId);

		if (!sessionHistoryStates) {
			return;
		}

		if (isEqual(this.sessionHistoryStates, sessionHistoryStates)) {
			return;
		}
		this.sessionHistoryStates = sessionHistoryStates;

		this.outputSessionLogs(sessionHistoryStates);

		const completedState = sessionHistoryStates.find((state) => state.isFinished());

		if (completedState) {
			this.printFinishedSessionLogs(completedState);
			return;
		}
	}

	private outputSessionLogs(sessionStates: SessionLogRecord[]) {
		const hasLogs = sessionStates.some((state) => state.getLogs());
		if (!hasLogs) {
			return;
		}
		for (let i = this.sessionLogOutputCursor; i < sessionStates.length; i++) {
			if (!sessionStates[i].isFinished() && sessionStates[i].getLogs()) {
				LoggerService.sessionLog(`${sessionStates[i].dateTime?.toISOString()}\t${sessionStates[i].getLogs()}`);
			}
		}
		this.sessionLogOutputCursor = sessionStates.length - 1;
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

	async displaySessionLogs(sessionId: string, stopSessionsInterval: boolean = false): Promise<void> {
		this.stopInterval(ProjectIntervalTypes.sessionHistory);
		LoggerService.clearOutputChannel(channels.appOutputSessionsLogName);

		this.initSessionLogsDisplay(sessionId);

		if (!this.selectedDeploymentId) {
			return;
		}

		this.selectedSessionPerDeployment.set(this.selectedDeploymentId, sessionId);
		if (stopSessionsInterval) {
			this.deploymentsWithLiveTail.set(this.selectedDeploymentId, false);
		}
	}

	async displaySessionLogsAndStop(sessionId: string) {
		this.displaySessionLogs(sessionId, true);
	}

	async initSessionLogsDisplay(sessionId: string) {
		if (this.cachedSessionHistoryStates.has(sessionId)) {
			const sessionHistoryStates = this.cachedSessionHistoryStates.get(sessionId);
			const lastState = sessionHistoryStates![sessionHistoryStates!.length - 1];
			this.outputSessionLogs(sessionHistoryStates!);
			this.printFinishedSessionLogs(lastState);
			return;
		}
		const sessionHistoryStates = await this.getSessionHistory(sessionId);
		if (!sessionHistoryStates) {
			return;
		}
		const lastState = sessionHistoryStates[sessionHistoryStates.length - 1];

		this.sessionLogOutputCursor = 0;
		this.sessionHistoryStates = [];

		if (lastState.isFinished()) {
			this.outputSessionLogs(sessionHistoryStates);
			this.printFinishedSessionLogs(lastState);
			this.cachedSessionHistoryStates.set(sessionId, sessionHistoryStates);
			return;
		}
		this.startInterval(
			ProjectIntervalTypes.sessionHistory,
			() => this.displaySessionsHistory(sessionId),
			this.sessionsLogRefreshRate
		);
	}

	async startInterval(intervalKey: ProjectIntervalTypes, loadFunc: () => Promise<any> | void, refreshRate: number) {
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

	public async openProject(onProjectDisposeCB: Callback<string>, onProjectDeleteCB: Callback<string>) {
		this.onProjectDisposeCB = onProjectDisposeCB;
		this.onProjectDeleteCB = onProjectDeleteCB;

		this.startLoader();
		const { data: project, error } = await ProjectsService.get(this.projectId);
		const log = translate().t("projects.projectNotFoundWithID", { id: this.projectId });
		this.stopLoader();

		if (error) {
			LoggerService.error(namespaces.projectController, (error as Error).message);
			commands.executeCommand(vsCommands.showErrorMessage, log);
			return;
		}
		if (!project) {
			LoggerService.error(namespaces.projectController, log);
		}
		this.project = project;
		this.view.show(project!.name);
		this.setProjectNameInView();

		this.startLoader();
		const { data: connections, error: connectionsError } = await ConnectionsService.list();
		this.stopLoader();

		if (connectionsError) {
			commands.executeCommand(vsCommands.showErrorMessage, (connectionsError as Error).message);
		}

		this.connections = connections;

		this.view.update({
			type: MessageType.setConnections,
			payload: this.connections,
		});

		this.sessions = undefined;
	}

	displayErrorWithoutActionButton(errorMessage: string) {
		commands.executeCommand(vsCommands.showErrorMessage, errorMessage, false);
	}

	async downloadResources(downloadPath?: string) {
		this.startLoader();
		const { data: existingResources, error } = await ProjectsService.getResources(this.projectId);
		this.stopLoader();

		if (error) {
			const notification = translate().t("projects.downloadResourcesDirectoryErrorForProject", {
				projectName: this.project?.name,
			});
			const log = translate().t("projects.downloadResourcesDirectoryError", {
				projectName: this.project?.name,
				error: (error as Error).message,
			});
			LoggerService.error(namespaces.projectController, log);
			commands.executeCommand(vsCommands.showErrorMessage, notification);
			return;
		}

		if (!existingResources || !Object.keys(existingResources).length) {
			commands.executeCommand(
				vsCommands.showInfoMessage,
				translate().t("projects.downloadResourcesDirectoryNoResources")
			);

			this.notifyViewResourcesPathChanged();
			return;
		}

		let savePath = downloadPath;

		if (!savePath) {
			const newLocalResourcesPath = await window.showOpenDialog({
				canSelectFolders: true,
				openLabel: translate().t("projects.downloadResourcesSelectDirectory"),
			});

			if (!newLocalResourcesPath || !newLocalResourcesPath.length) {
				return;
			}
			savePath = newLocalResourcesPath[0].fsPath;
		}

		Object.keys(existingResources).map(async (resource) => {
			const fullPath: string = path.join(savePath!, resource);
			const data: Uint8Array = existingResources[resource] as Uint8Array;
			try {
				await fsPromises.writeFile(fullPath, Buffer.from(data));
			} catch (error) {
				LoggerService.error(
					namespaces.projectController,
					translate().t("projects.downloadResourcesDirectoryError", {
						error: (error as Error).message,
						projectName: this.project!.name,
					})
				);
				commands.executeCommand(
					vsCommands.showErrorMessage,
					translate().t("projects.downloadResourcesDirectoryErrorProjectId", {
						projectName: this.project?.name,
						fileName: resource,
					})
				);
				return;
			}
		});

		const successMessage = translate().t("projects.downloadResourcesDirectorySuccess", {
			projectName: this.project?.name,
		});
		LoggerService.info(namespaces.projectController, successMessage);
		commands.executeCommand(vsCommands.showInfoMessage, successMessage);

		await commands.executeCommand(vsCommands.setContext, this.projectId, { path: savePath });

		this.notifyViewResourcesPathChanged();
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
		this.onProjectDisposeCB?.(this.projectId);
		this.hasDisplayedError = new Map();
		if (this.selectedDeploymentId) {
			this.deploymentsWithLiveTail.set(this.selectedDeploymentId, false);
		}
	}

	async build() {
		const { data: mappedResources, error: resourcesError } = await getLocalResources(this.projectId);

		if (resourcesError) {
			commands.executeCommand(vsCommands.showErrorMessage, (resourcesError as Error).message);
			LoggerService.error(namespaces.projectController, (resourcesError as Error).message);

			return;
		}
		this.startLoader();
		const { data: buildId, error } = await ProjectsService.build(this.projectId, mappedResources!);
		this.stopLoader();

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

		const newDirectoryPath = await window.showOpenDialog(options);
		if (!newDirectoryPath || newDirectoryPath.length === 0) {
			return;
		}

		const resourcePath = path.join(newDirectoryPath[0].fsPath, this.project!.name);
		try {
			createDirectory(resourcePath);
		} catch (error) {
			commands.executeCommand(
				vsCommands.showErrorMessage,
				translate().t("errors.creatingDirectory", { projectName: this.project?.name })
			);

			LoggerService.error(
				namespaces.projectController,
				translate().t("errors.creatingDirectoryExtended", {
					projectName: this.project?.name,
					error: (error as Error).message,
				})
			);
			return;
		}
		await this.downloadResources(resourcePath);

		await commands.executeCommand(vsCommands.setContext, this.projectId, { path: resourcePath });

		this.notifyViewResourcesPathChanged();
		return;
	}

	async run() {
		const { data: mappedResources, error: resourcesError } = await getLocalResources(this.projectId);

		if (resourcesError) {
			commands.executeCommand(vsCommands.showErrorMessage, (resourcesError as Error).message);
			LoggerService.error(namespaces.projectController, (resourcesError as Error).message);
			return;
		}

		this.startLoader();
		const { data: deploymentId, error } = await ProjectsService.run(this.projectId, mappedResources!);
		this.stopLoader();

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

		this.selectedDeploymentId = this.deployments?.find(
			(deployment: Deployment) => deployment.deploymentId === deploymentId
		)?.deploymentId;

		this.view.update({
			type: MessageType.selectDeployment,
			payload: this.selectedDeploymentId,
		});
	}

	async activateDeployment(deploymentId: string) {
		this.startLoader();
		const { error } = await DeploymentsService.activate(deploymentId);
		this.stopLoader();

		if (error) {
			const notification = translate().t("deployments.activationFailed");
			const log = `${translate().t("deployments.activationFailedId", {
				id: deploymentId,
			})} - ${(error as Error).message}`;
			commands.executeCommand(vsCommands.showErrorMessage, notification);
			LoggerService.error(namespaces.projectController, log);
			return;
		}

		LoggerService.info(
			namespaces.projectController,
			translate().t("deployments.activationSucceedId", { id: deploymentId })
		);
	}

	async startSession(startSessionArgs: StartSessionArgsType) {
		const sessionInputs = this.sessions?.find(
			(session: Session) => session.sessionId === startSessionArgs.sessionId
		)?.inputs;

		const enrichedSessionArgs = {
			...startSessionArgs,
			inputs: sessionInputs,
		};

		delete enrichedSessionArgs.sessionId;
		this.startLoader();
		const { data: sessionId, error } = await SessionsService.startSession(enrichedSessionArgs, this.projectId);
		this.stopLoader();

		if (error) {
			const notification = `${translate().t("sessions.executionFailed")} `;
			commands.executeCommand(vsCommands.showErrorMessage, notification);
			return;
		}
		const successMessage = translate().t("sessions.executionSucceed", { sessionId });
		LoggerService.info(namespaces.projectController, successMessage);
	}

	async deactivateDeployment(deploymentId: string) {
		this.startLoader();
		const { error } = await DeploymentsService.deactivate(deploymentId);
		this.stopLoader();

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
		const resourcesPath = await this.getResourcesPathFromContext();

		if (resourcesPath) {
			this.view.update({
				type: MessageType.setResourcesDir,
				payload: resourcesPath,
			});
			return;
		}

		this.view.update({
			type: MessageType.setResourcesDir,
			payload: "",
		});
	}

	async getResourcesPathFromContext() {
		const projectFromContext: { path?: string } = await commands.executeCommand(vsCommands.getContext, this.projectId);
		if (!projectFromContext || !projectFromContext.path || !fs.existsSync(projectFromContext.path)) {
			return;
		}
		return projectFromContext.path;
	}

	async stopSession(sessionId: string) {
		this.startLoader();
		const { error } = await SessionsService.stop(sessionId);
		this.stopLoader();

		if (error) {
			const notification = translate().t("sessions.stopFailed", { sessionId });
			commands.executeCommand(vsCommands.showErrorMessage, notification);
			const log = translate().t("sessions.stopFailedError", {
				sessionId,
				projectId: this.projectId,
				error: (error as Error).message,
			});
			LoggerService.error(namespaces.projectController, log);
			return;
		}
	}

	async deleteDeployment(deploymentId: string) {
		this.startLoader();
		const { error } = await DeploymentsService.delete(deploymentId);
		this.stopLoader();

		if (error) {
			const errorMessage = translate().t("deployments.deleteFailedId", { deploymentId });
			commands.executeCommand(vsCommands.showErrorMessage, errorMessage);

			return;
		}

		const log = translate().t("deployments.deleteSucceedIdProject", {
			deploymentId,
			projectId: this.projectId,
		});
		LoggerService.info(namespaces.projectController, log);
	}

	async copyProjectPath(projectPathToCopy: string): Promise<void> {
		try {
			await env.clipboard.writeText(projectPathToCopy);
			commands.executeCommand(
				vsCommands.showInfoMessage,
				translate().t("projects.projectPathCopied", { projectName: this.project?.name })
			);
		} catch (error) {
			commands.executeCommand(
				vsCommands.showInfoMessage,
				translate().t("errors.projectPathCopiedError", { projectName: this.project?.name })
			);
			LoggerService.error(
				namespaces.projectController,
				translate().t("errors.projectPathCopiedErrorEnriched", {
					error: (error as Error).message,
					projectName: this.project?.name,
				})
			);
		}
	}

	async openProjectResourcesDirectory(resourcesPath: string): Promise<void> {
		try {
			openFileExplorer(resourcesPath);
		} catch (error) {
			LoggerService.error(
				namespaces.projectController,
				translate().t("errors.errorOpeningFileExplorerError", {
					projectName: this.project?.name,
					error: (error as Error).message,
				})
			);
			commands.executeCommand(
				vsCommands.showErrorMessage,
				translate().t("errors.errorOpeningFileExplorerShort", { projectName: this.project?.name })
			);
		}
	}

	async setProjectResourcesDirectory(resourcesPath: string): Promise<void> {
		let currentDirectoryUri;
		try {
			currentDirectoryUri = Uri.file(resourcesPath);
		} catch (error) {
			LoggerService.error(
				namespaces.projectController,
				translate().t("projects.setResourcesDirectoryCurrentUriFailure", {
					error: (error as Error).message,
					projectName: this.project?.name,
				})
			);

			commands.executeCommand(
				vsCommands.showErrorMessage,
				translate().t("errors.setResourcesDirectoryFailureShort", { projectName: this.project?.name })
			);

			return;
		}

		let newLocalResourcesPath;
		try {
			newLocalResourcesPath = await window.showOpenDialog({
				canSelectFolders: true,
				canSelectFiles: false,
				defaultUri: currentDirectoryUri,

				openLabel: translate().t("projects.setResourcesDirectory"),
			});
		} catch (error) {
			LoggerService.error(
				namespaces.projectController,
				translate().t("projects.setResourcesDirectorGetPathFromDialogFailure", {
					error: (error as Error).message,
					projectName: this.project?.name,
				})
			);

			commands.executeCommand(
				vsCommands.showErrorMessage,
				translate().t("errors.setResourcesDirectoryFailureShort", { projectName: this.project?.name })
			);
			return;
		}

		if (newLocalResourcesPath === undefined || newLocalResourcesPath.length === 0) {
			return;
		}

		const currentProjectDirectory = await commands.executeCommand(vsCommands.getContext, this.projectId);

		const savePath = newLocalResourcesPath[0].fsPath;

		if (currentProjectDirectory && (currentProjectDirectory as { path: string })?.path !== savePath) {
			await commands.executeCommand(vsCommands.setContext, this.projectId, { path: savePath });
		}

		const successMessage = translate().t("projects.setResourcesDirectorySuccess", {
			projectName: this.project?.name,
		});
		LoggerService.info(namespaces.projectController, successMessage);
		commands.executeCommand(vsCommands.showInfoMessage, successMessage);

		await this.notifyViewResourcesPathChanged();
	}

	async deleteSession(sessionId: string) {
		this.startLoader();
		const { error } = await SessionsService.deleteSession(sessionId);
		this.stopLoader();

		if (error) {
			const notification = translate().t("sessions.sessionDeleteFailId", { sessionId });
			commands.executeCommand(vsCommands.showErrorMessage, notification);

			const log = translate().t("sessions.sessionDeleteError", {
				sessionId,
				error: (error as Error).message,
				projectId: this.projectId,
				deploymentId: this.selectedDeploymentId,
			});
			LoggerService.error(namespaces.projectController, log);

			return;
		}

		if (!this.sessions) {
			return;
		}

		LoggerService.clearOutputChannel(channels.appOutputSessionsLogName);
		const sessionIndex = this.sessions.findIndex((session) => session.sessionId === sessionId);

		this.sessions = this.sessions.splice(sessionIndex, 1);

		const followingSessionIdAfterDelete =
			sessionIndex < this.sessions.length - 1
				? this.sessions[sessionIndex].sessionId
				: this.sessions[sessionIndex - 1]?.sessionId;

		const sessionsViewObject: SessionSectionViewModel = {
			sessions: this.sessions,
			showLiveTail: !!this.isDeploymentLiveTailPossible,
			lastDeployment: this.deployments ? this.deployments[0] : undefined,
		};

		this.view.update({
			type: MessageType.setSessionsSection,
			payload: sessionsViewObject,
		});

		this.selectedSessionPerDeployment.set(this.selectedDeploymentId!, followingSessionIdAfterDelete);
		this.displaySessionLogs(followingSessionIdAfterDelete);

		this.view.update({
			type: MessageType.selectSession,
			payload: followingSessionIdAfterDelete,
		});

		const log = translate().t("sessions.sessionDeleteSuccessIdProject", {
			deploymentId: this.selectedDeploymentId,
			sessionId: sessionId,
			projectId: this.projectId,
		});
		LoggerService.info(namespaces.projectController, log);
	}

	async loadMoreSessions() {
		try {
			if (!this.sessionsNextPageToken) {
				return;
			}
			const selectedSessionStateFilter = reverseSessionStateConverter(this.filterSessionsState as SessionStateType);

			const { data, error } = await SessionsService.listByDeploymentId(
				this.selectedDeploymentId!,
				{
					stateType: selectedSessionStateFilter,
				},
				this.sessionsNextPageToken
			);
			if (error) {
				if (!this.hasDisplayedError.get(ProjectRecurringErrorMessages.sessions)) {
					commands.executeCommand(vsCommands.showErrorMessage, translate().t("errors.internalErrorUpdate"));
					this.hasDisplayedError.set(ProjectRecurringErrorMessages.sessions, true);
				}

				const log = `${translate().t("errors.sessionFetchFailed")} - ${(error as Error).message}`;
				LoggerService.error(namespaces.projectController, log);
				return;
			}

			const { sessions, nextPageToken } = data!;

			this.sessions = [...this.sessions!, ...sessions];

			this.sessionsNextPageToken = nextPageToken;

			const sessionsViewObject: SessionSectionViewModel = {
				sessions: this.sessions,
				showLiveTail: this.isDeploymentLiveTailPossible!,
				lastDeployment: this.deployments ? this.deployments[0] : undefined,
			};

			this.view.update({
				type: MessageType.setSessionsSection,
				payload: sessionsViewObject,
			});
		} catch (error) {
			console.log(error);
		}
	}

	async loadInitialDataOnceViewReady() {
		this.deployments = undefined;

		this.retryScheduler = new RetryScheduler(
			INITIAL_RETRY_SCHEDULE_COUNTDOWN,
			() => this.loadAndDisplayDeployments(),
			(countdown) => this.updateViewWithCountdown(countdown)
		);
		this.retryScheduler.startFetchInterval();

		const isResourcesPathExist = await this.getResourcesPathFromContext();
		if (isResourcesPathExist) {
			this.notifyViewResourcesPathChanged();
			return;
		}
	}

	toggleSessionsLiveTail(isLiveStateOn: Boolean) {
		if (!this.selectedDeploymentId) {
			return;
		}
		this.deploymentsWithLiveTail.set(this.selectedDeploymentId, !!isLiveStateOn);

		if (!isLiveStateOn) {
			return;
		}
		this.fetchSessions();
		this.sessionsNextPageToken = undefined;
		return;
	}

	openConnectionInitURL(connectionInitURL: string) {
		const initURL = Uri.parse(`${BASE_URL}${connectionInitURL}`);
		env.openExternal(initURL).then((success) => {
			if (!success) {
				commands.executeCommand(vsCommands.showErrorMessage, translate().t("errors.failedOpenConnectionInit"));
			}
		});
	}
}
