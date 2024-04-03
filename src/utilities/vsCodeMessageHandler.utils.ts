import { LoggerService } from "@services";
import { WorkspaceConfig } from "@utilities/workspaceConfig.util";
import { window } from "vscode";

export class MessageHandler {
	static infoMessage(messageText: string): void {
		const notificationsLevel = WorkspaceConfig.getFromWorkspace<string>("notificationsLevel", "");
		if (notificationsLevel !== "All") {
			return;
		}
		window.showInformationMessage(messageText);
	}
	static errorMessage(messageText: string): void {
		const notificationsLevel = WorkspaceConfig.getFromWorkspace<string>("notificationsLevel", "");
		if (notificationsLevel === "None") {
			return;
		}
		window.showErrorMessage(messageText, "View log").then((selection) => {
			if (selection === "View log") {
				LoggerService.reveal();
			}
		});
	}
}
