import { Deployment } from "@ak-proto-ts/deployments/v1/deployment_pb";
import { Project } from "@ak-proto-ts/projects/v1/project_pb";
import { DEFAULT_INTERVAL_LENGTH } from "@constants";
import { translate } from "@i18n";
import { IProjectView } from "@interfaces";
import {
	EnvironmentsService,
	DeploymentsService,
	ProjectsService,
	AuthorizationService,
} from "@services";
import { MessageType } from "@type";
import { getIds } from "@utilities/getIds";
import { MessageHandler } from "@views";
import { workspace } from "vscode";

export class ProjectController {
	private view: IProjectView;
	private intervalTimerId: NodeJS.Timeout | undefined;
	private disposeCB?: ProjectCB;
	public project: SidebarTreeItem;

	constructor(private projectView: IProjectView, project: SidebarTreeItem) {
		this.view = projectView;
		this.project = project;
		this.view.delegate = this;
	}

	update(data: any): void {
		this.view.update(data);
	}

	reveal(): void {
		this.view.reveal();
	}

	private async getProjectDeployments(project: SidebarTreeItem): Promise<Deployment[] | undefined> {
		const myUser = await AuthorizationService.whoAmI();
		if (project) {
			if (!myUser || !myUser.userId) {
				MessageHandler.errorMessage(translate().t("errors.userNotDefined"));
				return;
			}

			const projects = await ProjectsService.listForUser(myUser.userId);

			if (!projects.length) {
				MessageHandler.errorMessage(translate().t("errors.projectNotFound"));
				return;
			}

			const environments = await EnvironmentsService.listForProjects(
				getIds(projects, "projectId" as keyof Project)
			);

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

	private loadDataToWebview({ deployments }: { deployments: Deployment[] | undefined }) {
		this.view.update({
			type: MessageType.deployments,
			payload: deployments,
		});
		this.view.update({
			type: MessageType.project,
			payload: {
				name: this.project.label,
				projectId: this.project.key,
			},
		});
	}

	private async setIntervalForDataPush(project: SidebarTreeItem) {
		const INTERVAL_LENGTH =
			((await workspace.getConfiguration().get("autokitteh.intervalLength")) as number) ||
			DEFAULT_INTERVAL_LENGTH;

		this.intervalTimerId = setInterval(async () => {
			const deployments = await this.getProjectDeployments(project);
			this.loadDataToWebview({ deployments });
		}, INTERVAL_LENGTH);
	}

	public async openProject(disposeCB: ProjectCB) {
		this.disposeCB = disposeCB;

		this.view.show(this.project.label);
		const deployments = await this.getProjectDeployments(this.project);
		this.loadDataToWebview({ deployments });
		this.startInterval();
		// TODO: Implement theme watcher
	}

	async startInterval() {
		return await this.setIntervalForDataPush(this.project);
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
		}
	}

	onClose() {
		if (this.intervalTimerId) {
			clearInterval(this.intervalTimerId);
		}
		if (this.disposeCB) {
			this.disposeCB(this.project.key);
		}
	}

	build() {}

	deploy() {
		if (this.intervalTimerId) {
			clearInterval(this.intervalTimerId);
		}
	}
}
