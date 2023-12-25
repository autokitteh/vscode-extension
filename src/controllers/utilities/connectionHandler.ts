import { ConnectError } from "@connectrpc/connect";
import { BASE_URL, vsCommands } from "@constants";
import { gRPCErrors } from "@constants/api.constants";
import { translate } from "@i18n";
import { AuthorizationService } from "@services";
import { ValidateURL } from "@utilities";
import { ConfigurationTarget, commands, workspace } from "vscode";

export class ConnectionHandler {
	static reconnectIntervalId: NodeJS.Timeout | null = null;
	static reconnectInterval = 5000;
	static maxReconnectAttempts = 10;
	static reconnectAttempts = 0;
	static connectionCheckIntervalId: NodeJS.Timeout | null = null;
	static connectionCheckInterval = 5000;

	static isConnected = false;

	static connect = async (): Promise<void> => {
		if (!ValidateURL(BASE_URL)) {
			commands.executeCommand(vsCommands.showErrorMessage, translate().t("errors.badHostURL"));
			commands.executeCommand(vsCommands.disconnect);
			ConnectionHandler.isConnected = false;
			await ConnectionHandler.updateConnectionStatus(false);
			return;
		}

		try {
			const { error } = await AuthorizationService.whoAmI();
			if (error) {
				throw new Error((error as ConnectError).message);
			}
			ConnectionHandler.updateConnectionStatus(true);
			ConnectionHandler.isConnected = true;
			ConnectionHandler.startConnectionCheckInterval();
		} catch (error: unknown) {
			if (error instanceof ConnectError) {
				if (error.code === gRPCErrors.serverNotRespond) {
					commands.executeCommand(
						vsCommands.showErrorMessage,
						translate().t("errors.serverNotRespond")
					);
					commands.executeCommand(vsCommands.disconnect);
				}
			} else if (error instanceof Error) {
				commands.executeCommand(vsCommands.showErrorMessage, error.message);
			} else if (typeof error === "string") {
				commands.executeCommand(vsCommands.showErrorMessage, error);
			}
			ConnectionHandler.isConnected = false;
		}
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

	static startConnectionCheckInterval() {
		if (ConnectionHandler.connectionCheckIntervalId === null) {
			ConnectionHandler.connectionCheckIntervalId = setInterval(async () => {
				const currentStatus = await ConnectionHandler.getConnectionStatus();
				ConnectionHandler.isConnected = currentStatus;
			}, ConnectionHandler.connectionCheckInterval);
		}
	}

	static stopConnectionCheckInterval() {
		if (ConnectionHandler.connectionCheckIntervalId !== null) {
			clearInterval(ConnectionHandler.connectionCheckIntervalId);
			ConnectionHandler.connectionCheckIntervalId = null;
		}
	}

	static reconnect() {
		if (ConnectionHandler.reconnectIntervalId === null) {
			ConnectionHandler.reconnectIntervalId = setInterval(async () => {
				if (ConnectionHandler.reconnectAttempts < ConnectionHandler.maxReconnectAttempts) {
					const isConnected = await ConnectionHandler.getConnectionStatus();
					if (isConnected) {
						clearInterval(ConnectionHandler.reconnectIntervalId as NodeJS.Timeout);
						ConnectionHandler.reconnectIntervalId = null;
						ConnectionHandler.reconnectAttempts = 0;
						commands.executeCommand(vsCommands.connect);
						ConnectionHandler.isConnected = true;
						await ConnectionHandler.updateConnectionStatus(true);
					} else {
						commands.executeCommand(
							vsCommands.showErrorMessage,
							translate().t("errors.serverNotRespond")
						);
						ConnectionHandler.reconnectAttempts++;
					}
				} else {
					await ConnectionHandler.updateConnectionStatus(false);
					clearInterval(ConnectionHandler.reconnectIntervalId as NodeJS.Timeout);
					ConnectionHandler.reconnectIntervalId = null;
				}
			}, ConnectionHandler.reconnectInterval);
		}
	}
}
