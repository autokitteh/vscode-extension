import { AutokittehProjectWebview, MyTreeStrProvider } from "@panels/index";
import { Deployment, MessageType } from "@type/index";
import { Disposable } from "vscode";

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
};

/**
 * Refreshes the projects tree and webview with the latest data.
 * @param {Disposable} myTree - The projects tree provider.
 * @param {Deployment[]} deployments - The deployments data.
 * @param {AutokittehProjectWebview} currentPanel - The current webview panel.
 * @param {string[]} projectNamesStrArr - The project names array.
 * @returns {Promise<void>}
 */
const refreshInfo = async (
	myTree: Disposable,
	deployments: Deployment[],
	currentPanel: AutokittehProjectWebview | undefined,
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
 * @param {AutokittehProjectWebview} currentPanel - The current webview panel.
 * @param {string[]} projectNamesStrArr - The project names array.
 * @returns {void}
 */
export const pollData = async (
	connection: LocalhostConnection,
	myTree: Disposable,
	deployments: Deployment[],
	currentPanel: AutokittehProjectWebview | undefined,
	projectNamesStrArr: string[]
) => {
	clearInterval(connection.timer as IntervalTimer);
	connection.timer = setInterval(
		() => refreshInfo(myTree, deployments, currentPanel, projectNamesStrArr),
		1000
	);
};
