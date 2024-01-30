import { LoggerService } from "@services";
import { window } from "vscode";

export class MessageHandler {
	static infoMessage(namespace: string, messageText: string): void {
		window.showInformationMessage(messageText);
	}
	static errorMessage(namespace: string, messageText: string): void {
		window.showErrorMessage(messageText, "View log").then((selection) => {
			if (selection === "View log") {
				LoggerService.reveal();
			}
		});
	}
}
