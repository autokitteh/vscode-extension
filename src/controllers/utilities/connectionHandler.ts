import { ConnectError } from "@connectrpc/connect";
import { BASE_URL, vsCommands } from "@constants";
import { errorHelper } from "@controllers/utilities/errorHelper";
import { translate } from "@i18n";
import { AuthorizationService } from "@services";
import { ValidateURL } from "@utilities";
import { ConfigurationTarget, commands, workspace } from "vscode";

export class ConnectionHandler {
	static reconnectIntervalId: NodeJS.Timeout | null = null;
	static reconnectInterval = Number(
		workspace.getConfiguration().get("autokitteh.connectionTest.refresh.interval")
	);
	static maxReconnectAttempts = Number(
		workspace.getConfiguration().get("autokitteh.connectionTest.maxReconnectAttempts")
	);
	static reconnectAttempts = 0;

	static isConnected = false;

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
		if (ConnectionHandler.reconnectIntervalId === null) {
			ConnectionHandler.reconnectIntervalId = setInterval(async () => {
				if (ConnectionHandler.reconnectAttempts < ConnectionHandler.maxReconnectAttempts) {
					const isConnected = await ConnectionHandler.getConnectionStatus();
					if (isConnected) {
						ConnectionHandler.isConnected = true;
						await ConnectionHandler.updateConnectionStatus(true);
					} else {
						if (ConnectionHandler.reconnectAttempts === 0) {
							commands.executeCommand(
								vsCommands.showErrorMessage,
								translate().t("errors.serverNotRespond")
							);
						}
						ConnectionHandler.isConnected = false;
						ConnectionHandler.reconnectAttempts++;
					}
				} else {
					this.stopTestConnection();
				}
			}, ConnectionHandler.reconnectInterval);
		}
	}

	static async stopTestConnection() {
		await ConnectionHandler.updateConnectionStatus(false);
		clearInterval(ConnectionHandler.reconnectIntervalId as NodeJS.Timeout);
		ConnectionHandler.reconnectIntervalId = null;
		ConnectionHandler.reconnectAttempts = 0;
	}
}
