import { LoggerService } from "@services";
import { WorkspaceConfig } from "@utilities/workspaceConfig.util";
import { window } from "vscode";

export class MessageHandler {
	private static notificationsLevel = WorkspaceConfig.getFromWorkspace<string>("notificationsLevel", "");

	static infoMessage(messageText: string): void {
		if (MessageHandler.notificationsLevel !== "All") {
			return;
		}
		window.showInformationMessage(messageText);
	}
	static errorMessage(messageText: string): void {
		if (MessageHandler.notificationsLevel === "None") {
			return;
		}
		window.showErrorMessage(messageText, "View log").then((selection) => {
			if (selection === "View log") {
				LoggerService.reveal();
			}
		});
	}
	static warnMessage(messageText: string): void {
		window.showWarningMessage(messageText).then((selection) => {
			if (selection === "View log") {
				LoggerService.reveal();
			}
		});
	}
}
