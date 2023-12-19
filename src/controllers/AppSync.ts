// import { SidebarController } from "@controllers/Sidebar.controller";
// import { AuthorizationService } from "@services/auth";
// import { IntervalTimer, LocalhostConnection } from "@type/connection";
// import { EmptySidebarTree } from "@views";
// import { ConfigurationTarget, workspace, window } from "vscode";

// export class AppSync {
// 	static pollData = async (
// 		connection: LocalhostConnection,
// 		selectedProject?: string
// 	): Promise<LocalhostConnection> => {
// 		clearInterval(connection.timer as IntervalTimer);
// 		connection = await this.setConnetionSettings(connection, true);
// 		connection.timer = setInterval(() => this.refreshInfo(), 1000);

// 		return connection;
// 	};

// 	static stopPolling = async (connection: LocalhostConnection): Promise<LocalhostConnection> => {
// 		window.registerTreeDataProvider("autokittehSidebarTree", new EmptySidebarTree());
// 		connection = await this.setConnetionSettings(connection, false);

// 		clearInterval(connection.timer as IntervalTimer);
// 		return connection;
// 	};

// 	private static refreshInfo = async () => {
// 		const myUser = await AuthorizationService.whoAmI();

// 		if (myUser && myUser.userId) {
// 			SidebarController.updateView(myUser.userId);
// 		}
// 	};

// 	private static setConnetionSettings = async (
// 		connection: LocalhostConnection,
// 		isRunning: boolean
// 	) => {
// 		await workspace
// 			.getConfiguration()
// 			.update("autokitteh.serviceEnabled", isRunning, ConfigurationTarget.Global);
// 		connection.isRunning = isRunning;
// 		return connection;
// 	};
// }
