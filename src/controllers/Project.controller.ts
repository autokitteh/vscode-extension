import { Deployment } from "@ak-proto-ts/deployments/v1/deployment_pb";
import { Project } from "@ak-proto-ts/projects/v1/project_pb";
import { DEFAULT_INTERVAL_LENGTH } from "@constants/extension-configuration";
import { translate } from "@i18n/index";
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
	private projectId: string;

	constructor(private projectView: IProjectView, projectId: string) {
		this.view = projectView;
		this.projectId = projectId;
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

	private loadDataToWebview({
		deployments,
		project,
	}: {
		deployments: Deployment[] | undefined;
		project: SidebarTreeItem;
	}) {
		this.view.update({
			type: MessageType.deployments,
			payload: deployments,
		});
		this.view.update({
			type: MessageType.project,
			payload: {
				name: project.label,
				projectId: project.key,
			},
		});
	}

	private async setIntervalForDataPush(project: SidebarTreeItem) {
		const INTERVAL_LENGTH =
			((await workspace.getConfiguration().get("autokitteh.intervalLength")) as number) ||
			DEFAULT_INTERVAL_LENGTH;

		this.intervalTimerId = setInterval(async () => {
			const deployments = await this.getProjectDeployments(project);
			this.loadDataToWebview({ deployments, project });
		}, INTERVAL_LENGTH);
	}

	public async openProject(project: SidebarTreeItem, disposeCB: ProjectCB) {
		this.disposeCB = disposeCB;

		this.view.show(project.label);
		const deployments = await this.getProjectDeployments(project);
		this.loadDataToWebview({ deployments, project });
		this.startInterval(project);
		// TODO: Implement theme watcher
	}

	async startInterval(project: SidebarTreeItem) {
		return await this.setIntervalForDataPush(project);
	}

	// TODO: Start and stop interval on focus and unfocus

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
			this.disposeCB(this.projectId);
		}
	}

	build() {}

	deploy() {
		if (this.intervalTimerId) {
			clearInterval(this.intervalTimerId);
		}
	}
}
