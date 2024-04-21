import * as fs from "fs";
import * as fsPromises from "fs/promises";
import * as path from "path";
import { vsCommands, namespaces, channels } from "@constants";
import { convertBuildRuntimesToViewTriggers, getLocalResources } from "@controllers/utilities";
import { MessageType, ProjectIntervalTypes, ProjectRecurringErrorMessages, SessionStateType } from "@enums";
import { translate } from "@i18n";
import { IProjectView } from "@interfaces";
import { DeploymentSectionViewModel, SessionLogRecord, SessionSectionViewModel } from "@models";
import { reverseSessionStateConverter } from "@models/utils";
import { DeploymentsService, ProjectsService, SessionsService, LoggerService } from "@services";
import { BuildsService } from "@services";
import { StartSessionArgsType } from "@type";
import { Callback } from "@type/interfaces";
import { Deployment, Project, Session } from "@type/models";
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
	private sessionLogOutputCursor: number = 0;
	private deployments?: Deployment[];
	private deploymentsRefreshRate: number;
	private sessionsLogRefreshRate: number;
	private selectedDeploymentId?: string;
	private selectedSessionId?: string;
	private filterSessionsState?: string;
	private hasDisplayedError: Map<ProjectRecurringErrorMessages, boolean> = new Map();
	private selectedSessionPerDeployment: Map<string, string> = new Map();

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

	async deleteProject() {
		const { error } = await ProjectsService.delete(this.projectId);
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
		return sessionHistoryStates;
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
			this.initSessionLogsDisplay(this.selectedSessionId);
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
			if (!this.hasDisplayedError.get(ProjectRecurringErrorMessages.deployments)) {
				commands.executeCommand(vsCommands.showErrorMessage, notification);
				this.hasDisplayedError.set(ProjectRecurringErrorMessages.deployments, true);
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
		this.loadSingleshotArgs();
	}

	async loadSingleshotArgs() {
		const lastDeployment = this.deployments ? this.deployments[this.deployments?.length - 1] : null;

		if (!lastDeployment) {
			return;
		}

		const { data: buildDescription, error: buildDescriptionError } = await BuildsService.getBuildDescription(
			lastDeployment.buildId
		);

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

		const { data: sessions, error } = await SessionsService.listByDeploymentId(this.selectedDeploymentId, {
			stateType: selectedSessionStateFilter,
		});

		if (error) {
			if (!this.hasDisplayedError.get(ProjectRecurringErrorMessages.sessions)) {
				commands.executeCommand(vsCommands.showErrorMessage, translate().t("errors.internalErrorUpdate"));
				this.hasDisplayedError.set(ProjectRecurringErrorMessages.sessions, true);
			}

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
			payload: this.selectedDeploymentId,
		});

		if (!sessions?.length) {
			return;
		}

		if (this.selectedSessionPerDeployment.get(this.selectedDeploymentId)) {
			const isCurrentSelectedSessionDisplayed = sessions.find(
				(session) => session.sessionId === this.selectedSessionPerDeployment.get(this.selectedDeploymentId!)
			);

			if (isCurrentSelectedSessionDisplayed) {
				this.view.update({
					type: MessageType.selectSession,
					payload: isCurrentSelectedSessionDisplayed.sessionId,
				});
				this.displaySessionLogs(isCurrentSelectedSessionDisplayed?.sessionId!);
			}
			return;
		}

		this.view.update({
			type: MessageType.selectSession,
			payload: sessions[0].sessionId,
		});

		this.displaySessionLogs(sessions![0].sessionId);
		this.selectedSessionPerDeployment.set(this.selectedDeploymentId, sessions![0].sessionId);
	}

	async selectDeployment(deploymentId: string): Promise<void> {
		this.selectedDeploymentId = deploymentId;

		await this.fetchSessions();

		this.view.update({
			type: MessageType.selectDeployment,
			payload: deploymentId,
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

		const lastState = sessionHistoryStates[sessionHistoryStates.length - 1];

		this.outputSessionLogs(sessionHistoryStates);

		if (lastState.isFinished()) {
			this.printFinishedSessionLogs(lastState);
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

	async displaySessionLogs(sessionId: string): Promise<void> {
		this.stopInterval(ProjectIntervalTypes.sessionHistory);
		LoggerService.clearOutputChannel(channels.appOutputSessionsLogName);

		this.selectedSessionPerDeployment.set(this.selectedDeploymentId!, sessionId);

		this.selectedSessionId = sessionId;
		this.initSessionLogsDisplay(sessionId);
	}

	async initSessionLogsDisplay(sessionId: string) {
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
		} else {
			this.startInterval(
				ProjectIntervalTypes.sessionHistory,
				() => this.displaySessionsHistory(sessionId),
				this.sessionsLogRefreshRate
			);
		}
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

	public async openProject(onProjectDisposeCB: Callback<string>, onProjectDeleteCB: Callback<string>) {
		this.onProjectDisposeCB = onProjectDisposeCB;
		this.onProjectDeleteCB = onProjectDeleteCB;
		const { data: project, error } = await ProjectsService.get(this.projectId);
		const log = translate().t("projects.projectNotFoundWithID", { id: this.projectId });
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

		this.startInterval(
			ProjectIntervalTypes.deployments,
			() => this.loadAndDisplayDeployments(),
			this.deploymentsRefreshRate
		);

		const isResourcesPathExist = await this.getResourcesPathFromContext();

		if (isResourcesPathExist) {
			this.notifyViewResourcesPathChanged();
			return;
		}
	}

	displayErrorWithoutActionButton(errorMessage: string) {
		commands.executeCommand(vsCommands.showErrorMessage, errorMessage, false);
	}

	async downloadResources(downloadPath?: string) {
		const { data: existingResources, error } = await ProjectsService.getResources(this.projectId);

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
	}

	async build() {
		const { data: mappedResources, error: resourcesError } = await getLocalResources(this.projectId);

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
		const { data: sessionId, error } = await SessionsService.startSession(enrichedSessionArgs, this.projectId);

		if (error) {
			const notification = `${translate().t("sessions.executionFailed")} `;
			commands.executeCommand(vsCommands.showErrorMessage, notification);
			return;
		}
		const successMessage = translate().t("sessions.executionSucceed", { sessionId });
		LoggerService.info(namespaces.projectController, successMessage);
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
		const { error } = await SessionsService.stop(sessionId);
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
		const { error } = await DeploymentsService.delete(deploymentId);

		if (error) {
			const errorMessage = translate().t("deployments.deleteFailedId", { deploymentId });
			commands.executeCommand(vsCommands.showErrorMessage, errorMessage);

			this.view.update({
				type: MessageType.deploymentDeletedResponse,
				payload: false,
			});
			return;
		}

		this.view.update({
			type: MessageType.deploymentDeletedResponse,
			payload: true,
		});

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
		const { error } = await SessionsService.deleteSession(sessionId);
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

			this.view.update({
				type: MessageType.deleteSessionResponse,
			});

			return;
		}

		if (this.selectedSessionId === sessionId && this.sessions) {
			const sessionIndex = this.sessions.findIndex((session) => session.sessionId === sessionId);
			if (sessionIndex === -1 || this.sessions.length === 1) {
				LoggerService.clearOutputChannel(channels.appOutputSessionsLogName);
				return;
			}

			await this.fetchSessions();

			let followingSessionIdAfterDelete =
				sessionIndex < this.sessions.length - 1
					? this.sessions[sessionIndex].sessionId
					: this.sessions[sessionIndex - 1]?.sessionId;

			this.selectedSessionId = followingSessionIdAfterDelete;
			this.displaySessionLogs(this.selectedSessionId);
			this.selectedSessionPerDeployment.set(this.selectedDeploymentId!, followingSessionIdAfterDelete);

			this.view.update({
				type: MessageType.selectSession,
				payload: followingSessionIdAfterDelete,
			});
		}

		this.view.update({
			type: MessageType.deleteSessionResponse,
		});

		const log = translate().t("sessions.sessionDeleteSuccessIdProject", {
			deploymentId: this.selectedDeploymentId,
			sessionId: sessionId,
			projectId: this.projectId,
		});
		LoggerService.info(namespaces.projectController, log);
	}
}
