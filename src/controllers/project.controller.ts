import { vsCommands, pageLimits, namespaces, channels } from "@constants";
import { RequestHandler } from "@controllers/utilities/requestHandler";
import { MessageType, ProjectViewSections, SortOrder } from "@enums";
import { translate } from "@i18n";
import { IProjectView } from "@interfaces";
import { DeploymentSectionViewModel, SessionSectionViewModel } from "@models/views";
import {
	EnvironmentsService,
	DeploymentsService,
	ProjectsService,
	SessionsService,
	LoggerService,
} from "@services";
import { TotalEntityCount, PageLimits } from "@type/configuration";
import { ProjectCB } from "@type/interfaces";
import { Deployment, Project, Session } from "@type/models";
import { EntitySectionRowsRange } from "@type/views/webview";
import { sortArray, getIds } from "@utilities";
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
	private totalItemsPerSection: TotalEntityCount;
	private refreshRate: number;
	private entitySectionDisplayBounds: PageLimits;
	private selectedDeploymentId?: string;

	constructor(projectView: IProjectView, projectId: string, refreshRate: number) {
		this.view = projectView;
		this.projectId = projectId;
		this.view.delegate = this;
		this.refreshRate = refreshRate;
		this.totalItemsPerSection = {
			[ProjectViewSections.DEPLOYMENTS]: 0,
			[ProjectViewSections.SESSIONS]: 0,
		};
		this.entitySectionDisplayBounds = {
			[ProjectViewSections.DEPLOYMENTS]: {
				startIndex: 0,
				endIndex: pageLimits[ProjectViewSections.DEPLOYMENTS],
			},
			[ProjectViewSections.SESSIONS]: {
				startIndex: 0,
				endIndex: pageLimits[ProjectViewSections.SESSIONS],
			},
		};
	}

	reveal(): void {
		if (!this.project) {
			commands.executeCommand(vsCommands.showErrorMessage, translate().t("errors.unexpectedError"));
			return;
		}
		this.view.reveal(this.project.name);
	}

	async getProjectDeployments(): Promise<Deployment[] | undefined> {
		const { data: environments, error: environmentsError } =
			await RequestHandler.handleServiceResponse(() => EnvironmentsService.list(), {
				onFailureMessage: translate().t("errors.environmentsNotDefinedForProject"),
			});

		if (environmentsError || !environments?.length) {
			return [];
		}

		const environmentIds = getIds(environments, "envId");
		const { data: projectDeployments, error: deploymentsError } =
			await RequestHandler.handleServiceResponse(
				() => DeploymentsService.listByEnvironmentIds(environmentIds),
				{ onFailureMessage: translate().t("errors.deploymentsNotDefinedForProject") }
			);

		if (deploymentsError) {
			return;
		}
		return projectDeployments;
	}

	async loadDeployments() {
		const projectDeployments = await this.getProjectDeployments();
		sortArray(projectDeployments, "createdAt", SortOrder.DESC);
		this.totalItemsPerSection[ProjectViewSections.DEPLOYMENTS] = projectDeployments?.length || 0;

		const deploymentsForView = projectDeployments;

		if (!isEqual(this.deployments, deploymentsForView)) {
			this.deployments = deploymentsForView;
			const deploymentsViewObject: DeploymentSectionViewModel = {
				deployments: deploymentsForView,
				totalDeployments: this.totalItemsPerSection[ProjectViewSections.DEPLOYMENTS],
			};

			this.view.update({
				type: MessageType.setDeployments,
				payload: deploymentsViewObject,
			});
		}
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

		sortArray(sessions, "createdAt", SortOrder.DESC);
		this.totalItemsPerSection[ProjectViewSections.SESSIONS] = sessions?.length || 0;
		const sessionsForView = sessions;

		if (isEqual(this.sessions, sessionsForView) && this.sessions?.length) {
			return;
		}

		this.sessions = sessionsForView;
		const sessionsViewObject: SessionSectionViewModel = {
			sessions: sessionsForView,
			totalSessions: this.totalItemsPerSection[ProjectViewSections.SESSIONS],
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
			LoggerService.print(
				namespaces.sessionLogs,
				translate().t("sessions.noLogs"),
				channels.appOutputSessionsLogName
			);

			return;
		}

		if (lastState.isError()) {
			const printedError = lastState?.getError() || translate().t("errors.unexpectedError");
			LoggerService.print(
				namespaces.sessionLogs,
				`Error: ${printedError}}`,
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

	setRowsRangePerSection({ startIndex, endIndex, entity }: EntitySectionRowsRange) {
		const indexesAreValid = startIndex >= 0 && startIndex < endIndex;

		if (indexesAreValid) {
			const endIndexCalc = Math.min(this.totalItemsPerSection[entity], endIndex);
			this.entitySectionDisplayBounds[entity] = {
				startIndex,
				endIndex: endIndexCalc,
			};
		} else {
			this.entitySectionDisplayBounds[entity] = {
				startIndex: 0,
				endIndex: pageLimits[entity],
			};
		}
		if (entity === ProjectViewSections.DEPLOYMENTS) {
			this.loadDeployments();
		}
		if (entity === ProjectViewSections.SESSIONS && this.selectedDeploymentId) {
			this.selectDeployment(this.selectedDeploymentId);
		}
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
