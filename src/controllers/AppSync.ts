import { Project } from "@controllers/Project";
import { Sidebar } from "@controllers/Sidebar";
import { AuthorizationService } from "@services/auth";
import { IntervalTimer, LocalhostConnection } from "@type/connection";
import { EmptySidebarTree, ProjectWebview } from "@views";
import { ConfigurationTarget, workspace, window } from "vscode";

export class AppSync {
	static pollData = async (
		connection: LocalhostConnection,
		currentPanel?: ProjectWebview | undefined,
		selectedProject?: string
	): Promise<LocalhostConnection> => {
		clearInterval(connection.timer as IntervalTimer);
		connection = await this.setConnetionSettings(connection, true);
		connection.timer = setInterval(() => this.refreshInfo(currentPanel, selectedProject), 1000);

		return connection;
	};

	static stopPolling = async (
		connection: LocalhostConnection,
		currentPanel?: ProjectWebview | undefined
	): Promise<LocalhostConnection> => {
		window.registerTreeDataProvider("autokittehSidebarTree", new EmptySidebarTree());
		connection = await this.setConnetionSettings(connection, false);
		if (currentPanel) {
			currentPanel.dispose();
		}

		clearInterval(connection.timer as IntervalTimer);
		return connection;
	};

	private static refreshInfo = async (
		currentPanel?: ProjectWebview | undefined,
		selectedProject?: string
	) => {
		const myUser = await AuthorizationService.whoAmI();

		if (myUser && myUser.userId) {
			if (selectedProject) {
				Project.updateView(myUser.userId, currentPanel, selectedProject);
			}
			Sidebar.updateView(myUser.userId);
		}
	};

	private static setConnetionSettings = async (
		connection: LocalhostConnection,
		isRunning: boolean
	) => {
		await workspace
			.getConfiguration()
			.update("autokitteh.serviceEnabled", isRunning, ConfigurationTarget.Global);
		connection.isRunning = isRunning;
		return connection;
	};
}
