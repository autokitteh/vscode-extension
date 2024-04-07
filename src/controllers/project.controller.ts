import * as fs from "fs";
import * as fsPromises from "fs/promises";
import * as path from "path";
import { vsCommands, namespaces, channels } from "@constants";
import { convertBuildRuntimesToViewTriggers, getResources } from "@controllers/utilities";
import { MessageType, ProjectIntervalTypes } from "@enums";
import { translate } from "@i18n";
import { IProjectView } from "@interfaces";
import { DeploymentSectionViewModel, SessionLogRecord, SessionSectionViewModel } from "@models";
import { DeploymentsService, ProjectsService, SessionsService, LoggerService } from "@services";
import { BuildsService } from "@services";
import { StartSessionArgsType } from "@type";
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
			buildInfo = JSON.parse(buildDescription!.descriptionJson);
		} catch (error) {
			LoggerService.error(namespaces.projectController, translate().t("errors.buildInformationForSingleshotNotParsed"));
			return;
		}
		this.view.update({
			type: MessageType.setEntrypoints,
			payload: convertBuildRuntimesToViewTriggers(buildInfo.runtimes),
		});
	}

	async selectDeployment(deploymentId: string): Promise<void> {
		this.selectedDeploymentId = deploymentId;

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

		if (sessions?.length) {
			this.view.update({
				type: MessageType.selectSession,
				payload: sessions[0].sessionId,
			});

			this.displaySessionLogs(sessions![0].sessionId);
		}
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
		this.sessionHistoryStates = sessionHistoryStates;

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
		if (!project) {
			LoggerService.error(namespaces.projectController, log);
		}

		this.project = project;
		this.view.show(project!.name);

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

		const userResponse = await this.promptUserToDownloadResources();
		if (userResponse !== translate().t("projects.downloadResourcesDirectoryApprove")) {
			return;
		}
		await this.downloadResources();
	}

	displayErrorWithoutActionButton(errorMessage: string) {
		commands.executeCommand(vsCommands.showErrorMessage, errorMessage, false);
	}

	async downloadResources() {
		const { data: existingResources } = await ProjectsService.getResources(this.projectId);

		if (!existingResources) {
			commands.executeCommand(
				vsCommands.showInfoMessage,
				translate().t("projects.downloadResourcesDirectoryNoResources")
			);

			this.notifyViewResourcesPathChanged();
			return;
		}

		const newLocalResourcesPath = await window.showOpenDialog({
			canSelectFolders: true,
			openLabel: translate().t("projects.downloadResourcesSelectDirectory"),
		});

		if (!newLocalResourcesPath || !newLocalResourcesPath.length) {
			return;
		}

		const savePath = newLocalResourcesPath[0].fsPath;
		Object.keys(existingResources).map(async (resource) => {
			const fullPath: string = path.join(savePath, resource);
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
						projectId: this.projectId,
						fileName: resource,
					})
				);
				return;
			}
		});

		const successMessage = translate().t("projects.downloadResourcesDirectorySuccess", { projectId: this.projectId });
		LoggerService.info(namespaces.projectController, successMessage);
		commands.executeCommand(vsCommands.showInfoMessage, successMessage);

		await commands.executeCommand(vsCommands.setContext, this.projectId, { path: newLocalResourcesPath[0].fsPath });

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
		const successMessage = `${translate().t("sessions.executionSucceed")} for session ${sessionId}`;
		LoggerService.info(namespaces.projectController, successMessage);

		this.view.update({
			type: MessageType.selectSession,
			payload: sessionId,
		});

		this.selectedDeploymentId = startSessionArgs.deploymentId;
		this.view.update({
			type: MessageType.selectDeployment,
			payload: startSessionArgs.deploymentId,
		});
		this.displaySessionLogs(sessionId!);
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
		} else {
			this.view.update({
				type: MessageType.setResourcesDir,
				payload: "",
			});
		}
	}

	async getResourcesPathFromContext() {
		const projectFromContext: { path?: string } = await commands.executeCommand(vsCommands.getContext, this.projectId);
		if (!projectFromContext || !projectFromContext.path || !fs.existsSync(projectFromContext.path)) {
			return;
		}
		return projectFromContext.path;
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

	async promptUserToDownloadResources(): Promise<string | undefined> {
		return await window.showInformationMessage(
			translate().t("projects.downloadResourcesDirectory", { projectName: this.project!.name }),
			translate().t("projects.downloadResourcesDirectoryApprove"),
			translate().t("projects.downloadResourcesDirectoryDismiss")
		);
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
			LoggerService.error(namespaces.sessionsService, log);

			this.view.update({
				type: MessageType.deleteSessionResponse,
			});

			return;
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
