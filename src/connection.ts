import { AuthorizationController } from "@controllers/auth";
import { EnvironmentController, DeploymentController } from "@controllers/index";
import { ProjectController } from "@controllers/projects";
import { IntervalTimer, LocalhostConnection } from "@type/connection";
import { MessageType } from "@type/index";
import { getIds } from "@utilities/getIds";
import { ProjectWebview, TreeProvider } from "@views/index";
import { refreshSidebarTree } from "@views/trees/refreshSidebarTree";
import { workspace, ConfigurationTarget } from "vscode";

export const stopPolling = (connection: LocalhostConnection): void => {
	clearInterval(connection.timer as IntervalTimer);
};

const refreshInfo = async (currentPanel?: ProjectWebview | undefined, selectedProject?: string) => {
	const myUser = await AuthorizationController.whoAmI();

	if (myUser && myUser.userId) {
		/**** Refresh Sidebar - extract to separate func - controller.refreshSidebar */
		const projects = await ProjectController.listForUser(myUser.userId);
		const projectsTree = new TreeProvider(await ProjectController.listForTree(myUser.userId));
		refreshSidebarTree(projectsTree);

		/**** Refresh ProjectView - extract to separate func - controller.refreshProjectView */
		if (projects.length) {
			if (currentPanel) {
				const environments = await EnvironmentController.listForProjects(
					getIds(projects, "projectId")
				);

				if (environments.length) {
					const deployments = await DeploymentController.listForEnvironments(
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
				}
			}
		}
	}
};

/**
 * Starts polling for project data using the provided connection and updates the projects tree and webview.
 * @param {LocalhostConnection} connection - The connection object.
 * @param {Disposable} projectsTree - The projects tree provider.
 * @param {any[]} deployments - The deployments data.
 * @param {ProjectWebview} currentPanel - The current webview panel.
 * @param {string[]} projectNamesStrArr - The project names array.
 * @returns {void}
 */
export const pollData = (
	connection: LocalhostConnection,
	currentPanel?: ProjectWebview | undefined,
	selectedProject?: string
) => {
	clearInterval(connection.timer as IntervalTimer);
	connection.timer = setInterval(() => refreshInfo(currentPanel, selectedProject), 1000);
};

/**
 * Sets the connection status in the settings of VSCode.
 * @param {boolean} isRunning - The running status of the connection.
 * @param {LocalhostConnection} connection - connection for the manipulation
 * @returns {Promise<void>}
 */
export const setConnetionSettings = async (connection: LocalhostConnection, isRunning: boolean) => {
	await workspace
		.getConfiguration()
		.update("autokitteh.serviceEnabled", isRunning, ConfigurationTarget.Global);
	connection.isRunning = isRunning;
	return connection;
};
