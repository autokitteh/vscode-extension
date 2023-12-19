import { Project } from "@ak-proto-ts/projects/v1/project_pb";
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

export class ProjectController {
	private view: IProjectView;
	private intervalTimerId: NodeJS.Timeout | undefined;

	constructor(private projectView: IProjectView) {
		this.view = projectView;
		this.view.delegate = this;
	}

	update(data: any): void {
		this.view.update(data);
	}

	public async openProject(project: { name: string; key: string }) {
		this.view.show();

		// TODO: Implement theme watcher

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
						name: project.name,
						projectId: project.key,
					},
				});
			}
		}, 1000);
	}

	onClose() {
		if (this.intervalTimerId) {
			clearInterval(this.intervalTimerId);
		}
	}

	build() {}

	deploy() {
		if (this.intervalTimerId) {
			clearInterval(this.intervalTimerId);
		}
	}
}
