import {
	EnvironmentsService,
	DeploymentsService,
	ProjectsService,
	AuthorizationService,
} from "@services";
import { MessageType } from "@type";
import { getIds } from "@utilities/getIds";
import { ProjectWebview } from "@views";
import { MessageHandler } from "@views/MessageHandler";

export class Project {
	public static updateView = async (
		userId: string,
		currentPanel?: ProjectWebview | undefined,
		selectedProject?: string
	) => {
		const myUser = await AuthorizationService.whoAmI();
		const projects = await ProjectsService.listForUser(userId);

		if (myUser && myUser.userId) {
			if (projects.length) {
				if (currentPanel) {
					const environments = await EnvironmentsService.listForProjects(
						getIds(projects, "projectId" as keyof Project)
					);

					if (environments.length) {
						const deployments = await DeploymentsService.listForEnvironments(
							getIds(environments, "envId")
						);

						currentPanel.postMessageToWebview({
							type: MessageType.deployments,
							payload: deployments,
						});
						currentPanel.postMessageToWebview({
							type: MessageType.projectName,
							payload: selectedProject,
						});
					} else {
						MessageHandler.errorMessage("Environments not defined for this project");
					}
				} else {
					MessageHandler.errorMessage("Click on a project to show its details");
				}
			} else {
				MessageHandler.errorMessage("Not found projects");
			}
		} else {
			MessageHandler.errorMessage("User not defined");
		}
	};
}
