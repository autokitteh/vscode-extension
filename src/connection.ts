import { AKWebview, MyTreeStrProvider } from "@panels/index";
import { IntervalTimer, LocalhostConnection } from "@type/connection";
import { Deployment, MessageType } from "@type/index";
import { workspace, ConfigurationTarget } from "vscode";

/**
 * Stops polling for project data using the provided connection.
 * @param {LocalhostConnection} connection - The connection object.
 * @returns {void}
 */
export const stopPolling = (connection: LocalhostConnection): void => {
	clearInterval(connection.timer as IntervalTimer);
};

/**
 * Refreshes the projects tree and webview with the latest data.
 * @param {Disposable} myTree - The projects tree provider.
 * @param {Deployment[]} deployments - The deployments data.
 * @param {AKWebview} currentPanel - The current webview panel.
 * @param {string[]} projectNamesStrArr - The project names array.
 * @returns {Promise<void>}
 */
const refreshInfo = async (
	deployments: Deployment[],
	currentPanel: AKWebview | undefined,
	projectNamesStrArr: string[]
) => {
	if (currentPanel) {
		currentPanel.postMessageToWebview({
			type: MessageType.deployments,
			payload: deployments,
		});
		currentPanel.postMessageToWebview({
			type: MessageType.projectName,
			payload: projectNamesStrArr![0],
		});
	}
};

/**
 * Starts polling for project data using the provided connection and updates the projects tree and webview.
 * @param {LocalhostConnection} connection - The connection object.
 * @param {Disposable} projectsTree - The projects tree provider.
 * @param {any[]} deployments - The deployments data.
 * @param {AKWebview} currentPanel - The current webview panel.
 * @param {string[]} projectNamesStrArr - The project names array.
 * @returns {void}
 */
export const pollData = (
	connection: LocalhostConnection,
	deployments: Deployment[],
	currentPanel: AKWebview | undefined,
	projectNamesStrArr: string[]
) => {
	clearInterval(connection.timer as IntervalTimer);
	connection.timer = setInterval(
		() => refreshInfo(deployments, currentPanel, projectNamesStrArr),
		1000
	);
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
