import { fetchData as fetchBaseData } from "@controllers/index";
import { AKWebview, MyTreeStrProvider } from "@panels/index";
import { LocalhostConnection } from "@type/connection";
import { refreshSidebarTree } from "@utilities/refreshSidebarTree";
import { ExtensionContext } from "vscode";
import { pollData } from "../connection";

/**
 * Pushes data to a webview panel.
 * @param {typeof AKWebview | undefined} webviewPanel - The webview panel to push data to.
 * @param {LocalhostConnection} connection - The connection object.
 * @returns {Promise<void>} A promise that resolves when the data is pushed to the webview panel.
 */
export const pushDataToWebview = async (
	webviewPanel: typeof AKWebview | undefined,
	connection: LocalhostConnection,
	currentSidebarTree: AKWebview,
	context: ExtensionContext
) => {
	// Fetch data from the server
	const { projectNamesStrArr, deployments } = await fetchBaseData();
	// Create a new tree provider using the fetched project names
	const projectsTree = new MyTreeStrProvider(projectNamesStrArr);
	// Update the current sidebar tree with the new projects tree
	if (webviewPanel) {
		// Poll data from the connection and update the webview panel
		pollData(connection, deployments, webviewPanel.currentPanel, projectNamesStrArr);
	}
	return refreshSidebarTree(projectsTree, context);
};
