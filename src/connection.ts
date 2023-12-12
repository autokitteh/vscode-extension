import { AutokittehProjectWebview, MyTreeStrProvider } from "@panels/index";
import { Deployment, MessageType } from "@type/index";
import * as vscode from "vscode";

type IntervalTimer = ReturnType<typeof setInterval>;

export type LocalhostConnection = {
	isRunning: boolean;
	timer: IntervalTimer | undefined;
};

/**
 * Stops polling for project data using the provided connection.
 * @param {LocalhostConnection} connection - The connection object.
 * @returns {void}
 */
export const stopPolling = async (connection: LocalhostConnection) => {
	clearInterval(connection.timer as IntervalTimer);
	connection.isRunning = false;
	await setConnetionInSettings(false);
};

/**
 * Sets the connection status in the settings of VSCode.
 * @param {boolean} isRunning - The running status of the connection.
 * @returns {Promise<void>}
 */
const setConnetionInSettings = async (isRunning: boolean) =>
	await vscode.workspace
		.getConfiguration()
		.update("autokitteh.enabled", isRunning, vscode.ConfigurationTarget.Global);

/**
 * Refreshes the projects tree and webview with the latest data.
 * @param {MyTreeStrProvider} myTree - The projects tree provider.
 * @param {Deployment[]} deployments - The deployments data.
 * @param {AutokittehProjectWebview} currentPanel - The current webview panel.
 * @param {string[]} projectNamesStrArr - The project names array.
 * @returns {Promise<void>}
 */
const refreshInfo = async (
	myTree: MyTreeStrProvider,
	deployments: Deployment[],
	currentPanel: AutokittehProjectWebview | undefined,
	projectNamesStrArr: string[]
) => {
	myTree.refresh();
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
 * @param {MyTreeStrProvider} projectsTree - The projects tree provider.
 * @param {any[]} deployments - The deployments data.
 * @param {AutokittehProjectWebview} currentPanel - The current webview panel.
 * @param {string[]} projectNamesStrArr - The project names array.
 * @returns {void}
 */
export const pollData = (
	connection: LocalhostConnection,
	myTree: MyTreeStrProvider,
	deployments: Deployment[],
	currentPanel: AutokittehProjectWebview | undefined,
	projectNamesStrArr: string[]
) => {
	connection.timer = setInterval(
		() => refreshInfo(myTree, deployments, currentPanel, projectNamesStrArr),
		1000
	);
	connection.isRunning = true;
	setConnetionInSettings(true);
};
