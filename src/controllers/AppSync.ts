import { Project } from "@controllers/Project";
import { Sidebar } from "@controllers/Sidebar";
import { translate } from "@i18n/translation";
import { AuthorizationService } from "@services/auth";
import { IntervalTimer, LocalhostConnection } from "@type/connection";
import { ProjectWebview, TreeProvider } from "@views";
import { ConfigurationTarget, workspace } from "vscode";

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
		connection = await this.setConnetionSettings(connection, false);

		const disconnectedTree = new TreeProvider([translate().t("projects.clickHere")]);
		Sidebar.refreshSidebarTree(disconnectedTree);

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
