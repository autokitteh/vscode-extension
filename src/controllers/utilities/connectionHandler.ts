import { BASE_URL, vsCommands } from "@constants";
import { connectionHandlerInterval, connectionHandlerSlowInterval } from "@constants/api.constants";
import { errorHelper } from "@controllers/utilities/errorHelper";
import { translate } from "@i18n";
import { AuthorizationService } from "@services";
import { ValidateURL } from "@utilities";
import { ConfigurationTarget, commands, workspace } from "vscode";

export class ConnectionHandler {
	static reconnectIntervalId: NodeJS.Timeout | null = null;
	static isConnected = false;
	static startTime: number | null = null;
	static intervalDuration = connectionHandlerInterval;

	static connect = async (): Promise<void> => {
		if (!ValidateURL(BASE_URL)) {
			commands.executeCommand(vsCommands.showErrorMessage, translate().t("errors.badHostURL"));
			ConnectionHandler.isConnected = false;
			await ConnectionHandler.updateConnectionStatus(false);
			return;
		}

		const { error } = await AuthorizationService.whoAmI();
		if (error) {
			errorHelper(error);
			ConnectionHandler.isConnected = false;
			ConnectionHandler.updateConnectionStatus(false);
			return;
		}

		ConnectionHandler.isConnected = true;
		ConnectionHandler.updateConnectionStatus(true);
		ConnectionHandler.testConnection();
	};

	static disconnect = async (): Promise<void> => {
		await ConnectionHandler.updateConnectionStatus(false);
		ConnectionHandler.stopTestConnection();
	};

	static async updateConnectionStatus(isEnabled: boolean) {
		await workspace
			.getConfiguration()
			.update("autokitteh.serviceEnabled", isEnabled, ConfigurationTarget.Global);
	}

	static async getConnectionStatus() {
		try {
			const { error } = await AuthorizationService.whoAmI();
			return !error;
		} catch (error: unknown) {
			return false;
		}
	}

	static testConnection() {
		ConnectionHandler.startTime = Date.now();
		ConnectionHandler.reconnectIntervalId = setInterval(
			ConnectionHandler.performConnectionTest,
			ConnectionHandler.intervalDuration
		);
	}

	static async performConnectionTest() {
		const isConnected = await ConnectionHandler.getConnectionStatus();
		if (isConnected) {
			ConnectionHandler.isConnected = true;
			await ConnectionHandler.updateConnectionStatus(true);

			if (ConnectionHandler.intervalDuration !== connectionHandlerInterval) {
				ConnectionHandler.changeInterval(connectionHandlerInterval);
			}
			return;
		}

		ConnectionHandler.isConnected = false;
		await ConnectionHandler.updateConnectionStatus(false);

		const currentTime = Date.now();
		const elapsedTime = (currentTime - (ConnectionHandler.startTime || currentTime)) / 1000; // in seconds

		if (elapsedTime >= 3600) {
			// Stop the connection test after one hour
			ConnectionHandler.stopTestConnection();
			return;
		}

		if (elapsedTime >= 60 && ConnectionHandler.intervalDuration === connectionHandlerInterval) {
			// Change interval after the first minute
			ConnectionHandler.changeInterval(connectionHandlerSlowInterval);
		}
	}

	static changeInterval(newInterval: number) {
		clearInterval(ConnectionHandler.reconnectIntervalId as NodeJS.Timeout);
		ConnectionHandler.intervalDuration = newInterval;
		ConnectionHandler.reconnectIntervalId = setInterval(
			ConnectionHandler.performConnectionTest,
			newInterval
		);
	}

	static async stopTestConnection() {
		await ConnectionHandler.updateConnectionStatus(false);
		clearInterval(ConnectionHandler.reconnectIntervalId as NodeJS.Timeout);
		ConnectionHandler.reconnectIntervalId = null;
	}
}
