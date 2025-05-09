import * as fs from "fs";
import * as fsPromises from "fs/promises";
import isEqual from "lodash.isequal";
import * as path from "path";
import { commands, env, OpenDialogOptions, Uri, window } from "vscode";

import { namespaces, vsCommands, WEB_UI_URL } from "@constants";
import { convertBuildRuntimesToViewTriggers, getLocalResources } from "@controllers/utilities";
import { MessageType, ProjectRecurringErrorMessages, SessionStateType } from "@enums";
import { translate } from "@i18n";
import { IProjectView, SessionOutputLog } from "@interfaces";
import { DeploymentSectionViewModel, SessionSectionViewModel } from "@models";
import { reverseSessionStateConverter } from "@models/utils";
import { BuildsService, DeploymentsService, LoggerService, ProjectsService, SessionsService } from "@services";
import { UIStartSessionArgsType } from "@type";
import { Callback } from "@type/interfaces";
import { Deployment, Project, Session } from "@type/models";
import { createDirectory, openFileExplorer } from "@utilities";

export class ProjectController {
	private view: IProjectView;
	private onProjectDisposeCB?: Callback<string>;
	private onProjectDeleteCB?: Callback<string>;
	public projectId: string;
	public project?: Project;
	private sessions?: Session[] = [];
	private sessionOutputs: SessionOutputLog[] = [];
	private sessionOutputsNextPageToken?: string;
	private deployments?: Deployment[];
	private selectedDeploymentId?: string;
	private selectedSessionId?: string;
	private filterSessionsState?: string;
	private hasDisplayedError: Map<ProjectRecurringErrorMessages, boolean> = new Map();
	private selectedSessionPerDeployment: Map<string, string> = new Map();
	private loadingRequestsCounter: number = 0;
	private sessionsNextPageToken?: string;
	private deploymentsWithLiveTail: Map<string, boolean> = new Map();
	private lastDeploymentId?: string;
	private isNewPageInstance: boolean = true;

	constructor(projectView: IProjectView, projectId: string) {
		this.view = projectView;
		this.projectId = projectId;
		this.view.delegate = this;
	}

	reveal(): void {
		this.startLoader();
		this.view.reveal(this.project!.name);

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

		const organizationId =
			((await commands.executeCommand(vsCommands.getContext, "organizationId")) as string) || undefined;
		const organizationName =
			((await commands.executeCommand(vsCommands.getContext, "organizationName")) as string) || undefined;
		await commands.executeCommand(vsCommands.reloadProjects, organizationId, organizationName);
		this.onProjectDeleteCB?.(this.projectId);
	}

	async getSessionHistory(
		sessionId: string,
		nextPageToken?: string
	): Promise<{ sessionOutputs?: SessionOutputLog[]; nextPageToken?: string } | undefined> {
		this.startLoader();

		const { data, error: sessionOutputsError } = await SessionsService.getOutputsBySessionId(sessionId, nextPageToken);
		if (!data) {
			return;
		}
		const { outputs: sessionOutputs, nextPageToken: newNextPageToken } = data;

		this.stopLoader();

		if (sessionOutputsError) {
			if (!this.hasDisplayedError.get(ProjectRecurringErrorMessages.sessionLogs)) {
				const notificationErrorMessage = translate().t("errors.sessionLogRecordFetchFailedShort", {
					deploymentId: this.selectedDeploymentId,
				});
				commands.executeCommand(vsCommands.showErrorMessage, notificationErrorMessage);
				this.hasDisplayedError.set(ProjectRecurringErrorMessages.sessionLogs, true);
			}

			const logErrorMessage = translate().t("errors.sessionLogRecordFetchFailed", {
				deploymentId: this.selectedDeploymentId,
				error: ((sessionOutputsError as Error) || (sessionOutputsError as Error)).message,
			});
			LoggerService.error(namespaces.projectController, logErrorMessage);
			return { sessionOutputs: [] };
		}
		if (!sessionOutputs.length) {
			return { sessionOutputs: [] };
		}
		return { sessionOutputs, nextPageToken: newNextPageToken };
	}

	public enable = async () => {
		this.setProjectNameInView();
		await this.notifyViewResourcesPathChanged();
		this.deployments = undefined;
		await this.loadAndDisplayDeployments();
		await this.loadSingleshotArgs(true);

		this.sessions = undefined;
		this.fetchSessions();
	};

	public reconnect = async () => {
		const isServerHealthy = await this.checkServerHealth();
		if (isServerHealthy) {
			this.deployments = undefined;
			this.loadAndDisplayDeployments();
		}
	};

	public disable = async () => {
		this.deployments = undefined;
		this.sessions = undefined;
		this.hasDisplayedError = new Map();
	};

	public tryToReenable = async () => {
		this.reconnect();
		commands.executeCommand(vsCommands.reconnectSidebar);
	};

	async loadAndDisplayDeployments() {
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

			return;
		}

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

	async loadSingleshotArgs(force?: boolean) {
		if (!this.deployments || !this.deployments.length) {
			return;
		}
		const lastDeployment = this.deployments[0];

		if (!force && this.lastDeploymentId === lastDeployment?.deploymentId) {
			return;
		}

		this.lastDeploymentId = lastDeployment.deploymentId;

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

		const triggerFilenames = convertBuildRuntimesToViewTriggers(buildInfo.runtimes);

		this.view.update({
			type: MessageType.setEntrypoints,
			payload: triggerFilenames,
		});
	}

	async setSessionsStateFilter(filterState: string) {
		if (this.filterSessionsState === filterState) {
			return;
		}
		this.filterSessionsState = filterState;
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

		this.loadAndDisplayDeployments();

		this.sessions = sessions;
		this.sessionsNextPageToken = nextPageToken;

		const sessionsViewObject: SessionSectionViewModel = {
			sessions,
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

		this.view.update({
			type: MessageType.selectDeployment,
			payload: this.selectedDeploymentId,
		});

		await this.fetchSessions();
		return;
	}

	async displaySessionLogs(sessionId: string, stopSessionsInterval: boolean = false): Promise<void> {
		this.initSessionLogsDisplay(sessionId);

		if (!this.selectedDeploymentId) {
			return;
		}

		this.selectedSessionPerDeployment.set(this.selectedDeploymentId, sessionId);
		if (stopSessionsInterval) {
			const sessionsViewObject: SessionSectionViewModel = {
				sessions: this.sessions,
				lastDeployment: this.deployments ? this.deployments[0] : undefined,
			};

			this.view.update({
				type: MessageType.setSessionsSection,
				payload: sessionsViewObject,
			});
		}
	}

	async displaySessionLogsAndStop(sessionId: string) {
		this.selectedSessionId = sessionId;
		this.displaySessionLogs(sessionId, true);
	}

	async initSessionLogsDisplay(sessionId: string) {
		const { sessionOutputs, nextPageToken } = (await this.getSessionHistory(sessionId)) || {};

		if (!sessionOutputs) {
			return;
		}

		this.sessionOutputs = sessionOutputs;
		this.sessionOutputsNextPageToken = nextPageToken;

		this.updateSessionOutputsView();
	}

	async loadMoreSessionsOutputs() {
		if (!this.sessionOutputsNextPageToken) {
			this.updateSessionOutputsView();
			return;
		}

		const { sessionOutputs, nextPageToken } =
			(await this.getSessionHistory(this.selectedSessionId || "", this.sessionOutputsNextPageToken)) || {};

		if (!sessionOutputs || sessionOutputs.length === 0) {
			this.updateSessionOutputsView();
			return;
		}

		if (!nextPageToken) {
			return;
		}

		this.sessionOutputs = [...this.sessionOutputs, ...sessionOutputs];
		this.sessionOutputsNextPageToken = nextPageToken;

		this.updateSessionOutputsView();
	}

	private updateSessionOutputsView() {
		this.view.update({
			type: MessageType.setOutputs,
			payload: this.sessionOutputs,
		});
	}

	public async openProject(onProjectDisposeCB: Callback<string>, onProjectDeleteCB: Callback<string>) {
		this.onProjectDisposeCB = onProjectDisposeCB;
		this.onProjectDeleteCB = onProjectDeleteCB;

		this.startLoader();
		const { data: project, error } = await ProjectsService.get(this.projectId);
		const log = translate().t("errors.projectNotFoundWithID", { id: this.projectId });
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

		this.setResourcesPathToTheContext(savePath);
		this.notifyViewResourcesPathChanged(savePath);
	}

	onBlur() {
		this.disable();
	}

	onFocus() {
		this.enable();
	}

	onClose() {
		this.onProjectDisposeCB?.(this.projectId);
		this.hasDisplayedError = new Map();
		if (this.selectedDeploymentId) {
			this.deploymentsWithLiveTail.set(this.selectedDeploymentId, false);
		}
	}

	async build() {
		const projectPath = await this.getResourcesPathFromContext();
		const { data: mappedResources, error: resourcesError } = await getLocalResources(projectPath, this.projectId);

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

		this.setResourcesPathToTheContext(resourcePath);

		this.notifyViewResourcesPathChanged(resourcePath);
		return;
	}

	async run() {
		const projectPath = await this.getResourcesPathFromContext();
		const { data: mappedResources, error: resourcesError } = await getLocalResources(projectPath, this.projectId);

		if (resourcesError) {
			commands.executeCommand(vsCommands.showErrorMessage, (resourcesError as Error).message);
			LoggerService.error(namespaces.projectController, (resourcesError as Error).message);
			return;
		}

		this.startLoader();
		const { error } = await ProjectsService.run(this.projectId, mappedResources!);
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

		await this.loadAndDisplayDeployments();

		const successMessage = translate().t("projects.projectDeploySucceed", { id: this.projectId });
		commands.executeCommand(vsCommands.showInfoMessage, successMessage);
		LoggerService.info(namespaces.projectController, successMessage);
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
		await this.loadAndDisplayDeployments();

		LoggerService.info(
			namespaces.projectController,
			translate().t("deployments.activationSucceedId", { id: deploymentId })
		);
	}

	async startSession(startSessionArgs: UIStartSessionArgsType) {
		const sessionArguments = {
			deploymentId: startSessionArgs.deploymentId,
			buildId: startSessionArgs.buildId,
			entrypoint: {
				col: 0,
				row: 0,
				name: startSessionArgs.functionName,
				path: startSessionArgs.fileName,
			},
			jsonInputs: startSessionArgs.inputs,
		};

		this.startLoader();
		const { data: sessionId, error } = await SessionsService.startSession(sessionArguments, this.projectId);
		this.stopLoader();

		if (error) {
			const notification = `${translate().t("sessions.executionFailed")} `;
			commands.executeCommand(vsCommands.showErrorMessage, notification);
			return;
		}
		await this.loadAndDisplayDeployments();

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

	async notifyViewResourcesPathChanged(newLocalResourcesPath?: string) {
		const resourcesPath = (await this.getResourcesPathFromContext()) || newLocalResourcesPath;

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

	async setResourcesPathToTheContext(resourcePath: string) {
		const vscodeProjectsPaths = JSON.parse(await commands.executeCommand(vsCommands.getContext, "projectsPaths"));
		vscodeProjectsPaths[this.projectId] = resourcePath;

		await commands.executeCommand(vsCommands.setContext, "projectsPaths", JSON.stringify(vscodeProjectsPaths));
	}

	async getResourcesPathFromContext() {
		const projectFromContext: string = await commands.executeCommand(vsCommands.getContext, "projectsPaths");
		if (!projectFromContext) {
			return;
		}
		const vscodeProjectsPaths = JSON.parse(projectFromContext);
		const projectPath = vscodeProjectsPaths[this.projectId];
		if (!projectPath || !fs.existsSync(projectPath)) {
			return;
		}
		return projectPath;
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
		await this.fetchSessions();
	}

	async resetView() {
		this.sessions = undefined;
		this.view.update({
			type: MessageType.setSessionsSection,
			payload: [],
		});
		await this.loadAndDisplayDeployments();
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

		this.selectedDeploymentId = undefined;

		this.resetView();

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

		const currentProjectDirectory = await this.getResourcesPathFromContext();

		const savePath = newLocalResourcesPath[0].fsPath;

		if (currentProjectDirectory && currentProjectDirectory !== savePath) {
			this.setResourcesPathToTheContext(savePath);
		}

		const successMessage = translate().t("projects.setResourcesDirectorySuccess", {
			projectName: this.project?.name,
		});
		LoggerService.info(namespaces.projectController, successMessage);
		commands.executeCommand(vsCommands.showInfoMessage, successMessage);

		await this.notifyViewResourcesPathChanged(currentProjectDirectory);
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

		if (!this.sessions || !this.sessions.length) {
			const sessionsViewObject: SessionSectionViewModel = {
				sessions: [],
				lastDeployment: this.deployments ? this.deployments[0] : undefined,
			};

			this.view.update({
				type: MessageType.setSessionsSection,
				payload: sessionsViewObject,
			});

			return;
		}

		const sessionsBeforeRemove = this.sessions;

		const sessionIndex = sessionsBeforeRemove.findIndex((session) => session.sessionId === sessionId);

		sessionsBeforeRemove.splice(sessionIndex, 1);

		const sessionsViewObject: SessionSectionViewModel = {
			sessions: sessionsBeforeRemove,
			lastDeployment: this.deployments ? this.deployments[0] : undefined,
		};

		this.view.update({
			type: MessageType.setSessionsSection,
			payload: sessionsViewObject,
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

	private updateViewWithCountdown(countdown: string | number) {
		this.view.update({
			type: MessageType.setRetryCountdown,
			payload: countdown,
		});
	}

	async checkServerHealth(): Promise<boolean> {
		const { error } = await ProjectsService.get(this.projectId);
		if (!error) {
			this.view.update({
				type: MessageType.setRetryCountdown,
				payload: "",
			});
		}
		return !error;
	}

	async loadInitialDataOnceViewReady() {
		if (!this.isNewPageInstance) {
			return;
		}
		this.isNewPageInstance = false;
		this.loadAndDisplayDeployments();
		this.notifyViewResourcesPathChanged();
	}

	async refreshUI() {
		await this.loadAndDisplayDeployments();
	}

	async openTriggersWebUI() {
		const triggersWebUiURL = Uri.parse(`${WEB_UI_URL}/projects/${this.projectId}/triggers`);

		const initLinkOpenInBrowser = await env.openExternal(triggersWebUiURL);

		if (!initLinkOpenInBrowser) {
			const notification = translate().t("errors.failedOpenTriggers", {
				projectName: this.project?.name,
			});

			const log = translate().t("errors.failedOpenTriggersEnriched", {
				projectName: this.project?.name,
				linkURL: triggersWebUiURL,
			});

			commands.executeCommand(vsCommands.showErrorMessage, notification);
			LoggerService.error(namespaces.connectionsController, log);
		}
	}

	async openConnectionsWebUI() {
		const connectionsWebUiURL = Uri.parse(`${WEB_UI_URL}/projects/${this.projectId}/connections`);

		const initLinkOpenInBrowser = await env.openExternal(connectionsWebUiURL);

		if (!initLinkOpenInBrowser) {
			const notification = translate().t("errors.failedOpenConnections", {
				projectName: this.project?.name,
			});

			const log = translate().t("errors.failedOpenConnectionsEnriched", {
				projectName: this.project?.name,
				linkURL: connectionsWebUiURL,
			});

			commands.executeCommand(vsCommands.showErrorMessage, notification);
			LoggerService.error(namespaces.connectionsController, log);
		}
	}
}
