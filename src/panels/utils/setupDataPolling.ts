import { fetchBaseData } from "@controllers/index";
import { AKWebview, MyTreeStrProvider } from "@panels/index";
import { LocalhostConnection } from "@type/connection";
import { refreshSidebarTree } from "@utilities/refreshSidebarTree";
import { pollData } from "../../connection";

/**
 * Pushes data to a webview panel.
 * @param {typeof AKWebview | undefined} webviewPanel - The webview panel to push data to.
 * @param {LocalhostConnection} connection - The connection object.
 * @returns {Promise<void>} A promise that resolves when the data is pushed to the webview panel.
 */
export const pushDataToWebview = async (
	webviewPanel: typeof AKWebview | undefined,
	connection: LocalhostConnection,
	selectedProject?: string
) => {
	// Fetch data from the server
	const { projectNamesStrArr, deployments } = await fetchBaseData();
	// Create a new tree provider using the fetched project names
	const projectsTree = new MyTreeStrProvider(projectNamesStrArr);
	// Update the current sidebar tree with the new projects tree
	pollData(connection, deployments, webviewPanel?.currentPanel, selectedProject);

	// @TODO: Move into poll data
	refreshSidebarTree(projectsTree);
};
