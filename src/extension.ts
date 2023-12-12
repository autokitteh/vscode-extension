require("module-alias/register");

import { LocalhostConnection, pollData, stopPolling } from "./connection";
import { fetchData } from "@controllers";
import { Theme } from "@enums";
import { AutokittehProjectWebview, MyTreeStrProvider } from "@panels";
import { Message, MessageType } from "@type";
import { applyManifest, buildOnRightClick } from "@vscommands";
import {
	commands,
	ExtensionContext,
	window,
	workspace,
	ConfigurationTarget,
	Disposable,
} from "vscode";

export async function activate(context: ExtensionContext) {
	/**
	 * Sets the connection status in the settings of VSCode.
	 * @param {boolean} isRunning - The running status of the connection.
	 * @returns {Promise<void>}
	 */
	const setConnetionInSettings = async (isRunning: boolean) => {
		await workspace
			.getConfiguration()
			.update("autokitteh.serviceEnabled", isRunning, ConfigurationTarget.Global);
		connection.isRunning = isRunning;
	};

	setConnetionInSettings(false);

	let currentSidebarTree: Disposable;

	let currentProjectView: typeof AutokittehProjectWebview;
	const projectWebview = commands.registerCommand("autokitteh.ShowProject", () => {
		currentProjectView = AutokittehProjectWebview.render(context.extensionUri);
	});
	context.subscriptions.push(projectWebview);

	/*** Contextual menu "Build autokitteh" on a right click on an "autokitteh.yaml" file in the file explorer */
	const disposable = commands.registerCommand("autokitteh.v2.buildFolder", buildOnRightClick);

	context.subscriptions.push(disposable);

	/*** On theme change:
	 * Send the theme to the webview (light/dark)
	 */
	window.onDidChangeActiveColorTheme((editor) => {
		if (editor && currentProjectView.currentPanel) {
			currentProjectView.currentPanel.postMessageToWebview<Message>({
				type: MessageType.theme,
				payload: editor.kind as number as Theme,
			});
		}
	});

	/*** On webview open:
	 * - Render the view
	 * - Send the theme to the webview (light/dark)
	 */
	const openProjectCommand = commands.registerCommand("autokitteh.openWebview", (label) => {
		currentProjectView = AutokittehProjectWebview.render(context.extensionUri);

		const theme = window.activeColorTheme.kind as number as Theme;
		if (currentProjectView.currentPanel) {
			currentProjectView.currentPanel.postMessageToWebview<Message>({
				type: MessageType.theme,
				payload: theme,
			});
			pushDataToWebview(currentProjectView, connection);
		}
	});

	context.subscriptions.push(openProjectCommand);

	const updateSidebarTree = (newTree: MyTreeStrProvider): Disposable => {
		const projectsSidebarTree = window.registerTreeDataProvider("autokittehSidebarTree", newTree);

		context.subscriptions.push(projectsSidebarTree);
		return projectsSidebarTree;
	};

	const disconnectedTree = new MyTreeStrProvider(["Click here to connect"]);
	updateSidebarTree(disconnectedTree);

	const connection = {
		isRunning: workspace.getConfiguration().get("autokitteh.serviceEnabled") as boolean,
		timer: undefined,
	} as LocalhostConnection;

	/**
	 * Pushes data to a webview panel.
	 * @param {typeof AutokittehProjectWebview | undefined} webviewPanel - The webview panel to push data to.
	 * @param {LocalhostConnection} connection - The connection object.
	 * @returns {Promise<void>} A promise that resolves when the data is pushed to the webview panel.
	 */
	const pushDataToWebview = async (
		webviewPanel: typeof AutokittehProjectWebview | undefined,
		connection: LocalhostConnection
	) => {
		// Fetch data from the server
		const { projectNamesStrArr, deployments } = await fetchData();
		// Create a new tree provider using the fetched project names
		const projectsTree = new MyTreeStrProvider(projectNamesStrArr);
		// Update the current sidebar tree with the new projects tree
		currentSidebarTree = updateSidebarTree(projectsTree);

		if (webviewPanel) {
			// Poll data from the connection and update the webview panel
			pollData(
				connection,
				currentSidebarTree,
				deployments,
				webviewPanel.currentPanel,
				projectNamesStrArr
			);
		}
	};

	commands.registerCommand("autokittehSidebarTree.startPolling", async () => {
		await setConnetionInSettings(true);
		await pushDataToWebview(currentProjectView, connection);
	});

	commands.registerCommand("autokittehSidebarTree.stopPolling", async () => {
		await setConnetionInSettings(false);
		updateSidebarTree(disconnectedTree);
		stopPolling(connection);

		if (currentProjectView.currentPanel) {
			currentProjectView.currentPanel.dispose();
		}
	});

	/*** Build manifest using "Autokitteh V2: Apply Manifest" action from the command palette  */
	context.subscriptions.push(
		commands.registerCommand("autokitteh.v2.applyManifest", applyManifest)
	);
}
