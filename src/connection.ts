import { AutokittehProjectWebview, MyTreeStrProvider } from "@panels/index";
import { Deployment, MessageType } from "@type/index";
import * as vscode from "vscode";

type IntervalTimer = ReturnType<typeof setInterval>;

export type LocalhostConnection = {
	isRunning: boolean;
	timer: IntervalTimer | undefined;
};
export const stopPolling = async (connection: LocalhostConnection) => {
	clearInterval(connection.timer as IntervalTimer);
	connection.isRunning = false;
	await setConnetionInSettings(false);
};

const setConnetionInSettings = async (isRunning: boolean) =>
	await vscode.workspace
		.getConfiguration()
		.update("autokitteh.enabled", isRunning, vscode.ConfigurationTarget.Global);

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
