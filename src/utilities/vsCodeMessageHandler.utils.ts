import { window } from "vscode";

import { LoggerService } from "@services";
import { WorkspaceConfig } from "@utilities/workspaceConfig.util";

export class MessageHandler {
	private static notificationsLevel = WorkspaceConfig.getFromWorkspace<string>("notificationsLevel", "");

	static infoMessage(messageText: string): void {
		if (MessageHandler.notificationsLevel !== "All") {
			return;
		}
		window.showInformationMessage(messageText);
	}
	static errorMessage(messageText: string, displayShowLogButton = true): void {
		if (MessageHandler.notificationsLevel === "None") {
			return;
		}
		window.showErrorMessage(messageText, displayShowLogButton ? "View log" : "").then((selection) => {
			if (selection === "View log") {
				LoggerService.reveal();
			}
		});
	}
}
