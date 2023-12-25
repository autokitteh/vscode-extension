import { ConnectError } from "@connectrpc/connect";
import { vsCommands } from "@constants";
import { gRPCErrors } from "@constants/api.constants";
import { SidebarController } from "@controllers/sidebar.controller";
import { ConnectionHandler } from "@controllers/utilities/connectionHandler";
import { translate } from "@i18n/index";
import { ServiceResponse } from "@type/services.types";
import { MessageHandler } from "@views";
import { ConfigurationTarget, commands, workspace } from "vscode";

export class ResponseHandler {
	static intervalId: NodeJS.Timeout | null = null;
	static reconnectInterval = 5000;
	static maxReconnectAttempts = 10;
	static reconnectAttempts = 0;

	static async handleServiceResponse<T>(
		responsePromise: ServiceResponse<T>,
		onSuccessMessage?: string,
		onFailureMessage?: string
	) {
		if (!(await ConnectionHandler.getConnectionStatus())) {
			await ConnectionHandler.updateConnectionStatus(false);
			this.reconnect();
			return;
		}
		try {
			const response = await responsePromise;

			if (!response.error) {
				if (onSuccessMessage) {
					MessageHandler.infoMessage(onSuccessMessage);
				}
				return response.data as T;
			}
		} catch (error) {
			await ConnectionHandler.updateConnectionStatus(false);

			ResponseHandler.displayErrorMessage(
				error instanceof Error
					? error
					: onFailureMessage
						? new Error(onFailureMessage)
						: new Error(error as string)
			);
		}
	}

	static displayErrorMessage(error: Error) {
		MessageHandler.errorMessage(error.message);
	}

	static disconnect() {
		commands.executeCommand(vsCommands.disconnect);
		if (ResponseHandler.intervalId !== null) {
			clearInterval(ResponseHandler.intervalId);
			ResponseHandler.intervalId = null;
		}
	}

	static reconnect() {
		if (ResponseHandler.intervalId === null) {
			ResponseHandler.intervalId = setInterval(async () => {
				if (ResponseHandler.reconnectAttempts < ResponseHandler.maxReconnectAttempts) {
					const isConnected = await ConnectionHandler.getConnectionStatus();
					if (isConnected) {
						clearInterval(ResponseHandler.intervalId as NodeJS.Timeout);
						ResponseHandler.intervalId = null;
						ResponseHandler.reconnectAttempts = 0;
						await ConnectionHandler.updateConnectionStatus(true);
					} else {
						MessageHandler.errorMessage(translate().t("errors.serverNotRespond"));

						ResponseHandler.reconnectAttempts++;
					}
				} else {
					await ConnectionHandler.updateConnectionStatus(false);
					clearInterval(ResponseHandler.intervalId as NodeJS.Timeout);
					ResponseHandler.intervalId = null;
				}
			}, ResponseHandler.reconnectInterval);
		}
	}
}
