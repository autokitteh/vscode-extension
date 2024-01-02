import { DEFAULT_DEPLOYMENTS_PAGE_SIZE, vsCommands } from "@constants";
import { RequestHandler } from "@controllers/utilities/requestHandler";
import { MessageType, SortOrder } from "@enums";
import { translate } from "@i18n";
import { IProjectView } from "@interfaces";
import { DeploymentSectionViewModel } from "@models";
import {
	EnvironmentsService,
	DeploymentsService,
	ProjectsService,
	SessionsService,
} from "@services";
import { Deployment, Project, Session } from "@type/models";
import { sortArray } from "@utilities";
import { getIds } from "@utilities/getIds.utils";
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
	private totalDeployments: number;
	private refreshRate: number;
	private deploymentsPageLimits: PageSize;
	private selectedDeploymentId?: string;

	constructor(projectView: IProjectView, projectId: string, refreshRate: number) {
		this.view = projectView;
		this.projectId = projectId;
		this.view.delegate = this;
		this.refreshRate = refreshRate;
		this.deploymentsPageLimits = { startIndex: 0, endIndex: DEFAULT_DEPLOYMENTS_PAGE_SIZE };
		this.totalDeployments = 0;
	}

	reveal(): void {
		if (!this.project) {
			commands.executeCommand(
				vsCommands.showErrorMessage,
				translate().t("errors.projectNameMissing")
			);
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
		this.totalDeployments = projectDeployments?.length || 0;
		const deploymentsForView =
			projectDeployments?.slice(
				this.deploymentsPageLimits.startIndex,
				this.deploymentsPageLimits.endIndex
			) || undefined;

		if (!isEqual(this.deployments, deploymentsForView)) {
			this.deployments = deploymentsForView;
			const deploymentsViewObject: DeploymentSectionViewModel = {
				deployments: deploymentsForView,
				totalDeployments: this.totalDeployments,
			};

			this.view.update({
				type: MessageType.setDeployments,
				payload: deploymentsViewObject,
			});
		}
	}
	async selectDeployment(deploymentId: string) {
		this.selectedDeploymentId = deploymentId;
		const { data: sessions, error } = await SessionsService.listByDeploymentId(deploymentId);

		if (!error && !isEqual(this.sessions, sessions)) {
			this.sessions = sessions;
			this.view.update({ type: MessageType.setSessions, payload: sessions });
		}
	}

	startInterval() {
		if (!this.intervalTimerId) {
			this.view.update({ type: MessageType.setSessions, payload: undefined });

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
<<<<<<< HEAD
		this.deployments = undefined;
=======
>>>>>>> 6a7f3ef (fix: handle sections load on tab switch)
		this.sessions = undefined;
	}

	onFocus() {
		this.startInterval();
	}

	setDeploymentsPageSize({ startIndex, endIndex }: PageSize) {
		const indexesAreValid = startIndex >= 0 && startIndex < endIndex;

		if (indexesAreValid) {
			this.deploymentsPageLimits = {
				startIndex,
				endIndex: Math.min(this.totalDeployments, endIndex),
			};
		} else {
			this.deploymentsPageLimits = {
				startIndex: 0,
				endIndex: DEFAULT_DEPLOYMENTS_PAGE_SIZE,
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
