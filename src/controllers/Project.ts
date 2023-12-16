import {
	EnvironmentsService,
	DeploymentsService,
	ProjectsService,
	AuthorizationService,
} from "@services";
import { SharedContext } from "@services/context";
import { MessageType } from "@type";
import { getIds } from "@utilities/getIds";
import { ProjectWebview } from "@views";
import { MessageHandler } from "@views/utils/MessageHandler";
import * as i18n from "i18next";

export class Project {
	static i18n: typeof i18n = SharedContext.i18n;

	public static updateView = async (
		userId: string,
		currentPanel?: ProjectWebview | undefined,
		selectedProject?: string
	) => {
		const myUser = await AuthorizationService.whoAmI();
		const projects = await ProjectsService.listForUser(userId);

		if (!myUser || !myUser.userId) {
			MessageHandler.errorMessage(this.i18n.t("t:errors.userNotDefined"));
			return;
		}

		if (!projects.length) {
			MessageHandler.errorMessage(this.i18n.t("t:errors.projectNotFound"));
			return;
		}

		if (!currentPanel) {
			MessageHandler.errorMessage(this.i18n.t("t:errors.showProjectDetails"));
			return;
		}

		const environments = await EnvironmentsService.listForProjects(
			getIds(projects, "projectId" as keyof Project)
		);

		if (!environments.length) {
			MessageHandler.errorMessage(this.i18n.t("t:errors.environmentsNotDefinedForProject"));
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
}
