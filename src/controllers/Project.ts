import { translate } from "@i18n/translation";
import {
	EnvironmentsService,
	DeploymentsService,
	ProjectsService,
	AuthorizationService,
} from "@services";
import { MessageType } from "@type";
import { getIds } from "@utilities/getIds";
import { ProjectWebview } from "@views";
import { MessageHandler } from "@views/utils/MessageHandler";

export class Project {
	public static updateView = async (
		userId: string,
		currentPanel?: ProjectWebview | undefined,
		selectedProject?: string
	) => {
		const myUser = await AuthorizationService.whoAmI();
		const projects = await ProjectsService.listForUser(userId);

		if (!myUser || !myUser.userId) {
			MessageHandler.errorMessage(translate().t("errors.userNotDefined"));
			return;
		}

		if (!projects.length) {
			MessageHandler.errorMessage(translate().t("errors.projectNotFound"));
			return;
		}

		if (!currentPanel) {
			MessageHandler.errorMessage(translate().t("errors.showProjectDetails"));
			return;
		}

		const environments = await EnvironmentsService.listForProjects(
			getIds(projects, "projectId" as keyof Project)
		);

		if (!environments.length) {
			MessageHandler.errorMessage(translate().t("errors.environmentsNotDefinedForProject"));
			return;
		}

		const deployments = await DeploymentsService.listForEnvironments(getIds(environments, "envId"));

		currentPanel.postMessageToWebview({
			type: MessageType.deployments,
			payload: deployments,
		});
		currentPanel.postMessageToWebview({
			type: MessageType.projectName,
			payload: selectedProject,
		});
	};

	public static buildProject = async (
		projectId: string,
		currentPanel?: ProjectWebview | undefined
	) => {
		console.log(projectId);
	};
}
