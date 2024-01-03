import { vsCommands, pageLimits } from "@constants";
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
} from "@services";
import { TotalEntityCount, PageLimits } from "@type/configuration";
import { ProjectCB } from "@type/interfaces";
import { Deployment, Project, Session } from "@type/models";
import { EntitySectionRowsRange } from "@type/views/webview";
import { sortArray, getIds } from "@utilities";
import { MessageHandler } from "@views";
import isEqual from "lodash/isEqual";
import { commands } from "vscode";

export class ProjectController {
	private view: IProjectView;
	private intervalTimerId?: NodeJS.Timer;
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
		const projectDeployments = await this.getProjectDeployments();
		sortArray(projectDeployments, "createdAt", SortOrder.DESC);
		this.totalItemsPerSection[ProjectViewSections.DEPLOYMENTS] = projectDeployments?.length || 0;

		const { startIndex, endIndex } =
			this.entitySectionDisplayBounds[ProjectViewSections.DEPLOYMENTS];

		const deploymentsForView = projectDeployments?.slice(startIndex, endIndex) || undefined;

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
		if (this.selectedDeploymentId) {
			await this.selectDeployment(this.selectedDeploymentId);
		}
	}
	async selectDeployment(deploymentId: string) {
		this.selectedDeploymentId = deploymentId;
		const sessions = await RequestHandler.handleServiceResponse(() =>
			SessionsService.listByDeploymentId(deploymentId)
		);
		sortArray(sessions, "createdAt", SortOrder.DESC);
		this.totalItemsPerSection[ProjectViewSections.SESSIONS] = sessions?.length || 0;
		const { startIndex, endIndex } = this.entitySectionDisplayBounds[ProjectViewSections.SESSIONS];
		const sessionsForView = sessions?.slice(startIndex, endIndex) || undefined;

		if (!isEqual(this.sessions, sessionsForView)) {
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
	}

	startInterval() {
		if (!this.intervalTimerId) {
			this.view.update({ type: MessageType.setSessionsSection, payload: undefined });

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
