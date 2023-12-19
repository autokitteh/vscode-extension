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

	constructor(private projectView: IProjectView) {
		this.view = projectView;
		this.view.delegate = this;
	}

	update(data: any): void {
		this.view.update(data);
	}

	reveal(): void {
		this.view.reveal();
	}

	public async openProject(project: SidebarTreeItem, disposeCB: ProjectCB) {
		this.disposeCB = disposeCB;

		this.view.show();

		// TODO: Implement theme watcher
		const INTERVAL_LENGTH =
			((await workspace.getConfiguration().get("autokitteh.intervalLength")) as number) ||
			DEFAULT_INTERVAL_LENGTH;

		this.intervalTimerId = setInterval(async () => {
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

				const deployments = await DeploymentsService.listForEnvironments(
					getIds(environments, "envId")
				);

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
		}, INTERVAL_LENGTH);
	}

	onClose() {
		if (this.intervalTimerId) {
			clearInterval(this.intervalTimerId);
		}
		if (this.disposeCB) {
			// TODO: Add projectId into the controller
			this.disposeCB("test");
		}
	}

	build() {}

	deploy() {
		if (this.intervalTimerId) {
			clearInterval(this.intervalTimerId);
		}
	}
}
