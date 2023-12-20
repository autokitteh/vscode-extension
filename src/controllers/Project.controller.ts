import { Deployment } from "@ak-proto-ts/deployments/v1/deployment_pb";
import { Project } from "@ak-proto-ts/projects/v1/project_pb";
import { DEFAULT_PROJECT_VIEW_REFRESH_INTERVAL } from "@constants";
import { translate } from "@i18n";
import { IProjectView } from "@interfaces";
import { EnvironmentsService, DeploymentsService } from "@services";
import { MessageType } from "@type";
import { getIds } from "@utilities/getIds";
import { MessageHandler } from "@views";
import isEqual from "lodash/fp/isEqual";
import { workspace } from "vscode";

export class ProjectController {
	private view: IProjectView;
	private intervalTimerId?: NodeJS.Timer;
	private disposeCB?: ProjectCB;
	public project: Project;
	private deployments?: Deployment[];
	private refreshRate: number;

	constructor(private projectView: IProjectView, project: Project) {
		this.view = projectView;
		this.project = project;
		this.view.delegate = this;
		this.refreshRate =
			(workspace.getConfiguration().get("autokitteh.project.refresh.interval") as number) ||
			DEFAULT_PROJECT_VIEW_REFRESH_INTERVAL;
	}

	reveal(): void {
		this.view.reveal();
	}

	private async getProjectDeployments(): Promise<Deployment[] | undefined> {
		if (this.project.projectId) {
			const environments = await EnvironmentsService.getByProject(this.project.projectId);

			if (!environments.length) {
				MessageHandler.errorMessage(translate().t("errors.environmentsNotDefinedForProject"));
				return;
			}

			const deployments: Deployment[] = await DeploymentsService.listForEnvironments(
				getIds(environments, "envId")
			);

			return deployments || [];
		}
		return [];
	}

	private refreshView() {
		this.view.update({
			type: MessageType.deployments,
			payload: this.deployments,
		});
		this.view.update({
			type: MessageType.project,
			payload: {
				name: this.project.name,
				projectId: this.project.projectId,
			},
		});
	}

	private startViewUpdateInterval() {
		this.intervalTimerId = setInterval(async () => {
			const deploymentsResponse = await this.getProjectDeployments();
			if (!isEqual(this.deployments, deploymentsResponse)) {
				this.deployments = deploymentsResponse;
				this.refreshView();
			}
		}, this.refreshRate);
	}

	public async openProject(disposeCB: ProjectCB) {
		this.disposeCB = disposeCB;
		this.view.show(this.project.name);
		this.startInterval();
	}

	startInterval() {
		return this.startViewUpdateInterval();
	}

	public onBlur() {
		this.stopInterval();
	}

	public onFocus() {
		this.startInterval();
	}

	stopInterval() {
		if (this.intervalTimerId) {
			clearInterval(this.intervalTimerId);
			this.intervalTimerId = undefined;
		}
	}

	onClose() {
		if (this.intervalTimerId) {
			clearInterval(this.intervalTimerId);
		}
		if (this.disposeCB) {
			this.disposeCB(this.project.projectId);
		}
	}

	build() {}

	deploy() {
		if (this.intervalTimerId) {
			clearInterval(this.intervalTimerId);
		}
	}
}
