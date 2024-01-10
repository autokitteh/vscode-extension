import { LogLevel } from "@enums";
import { LoggerService } from "@services";
import { window } from "vscode";

export class MessageHandler {
	static infoMessage(namespace: string, messageText: string): void {
		window.showInformationMessage(messageText);
		LoggerService.log(namespace, messageText);
	}
	static errorMessage(namespace: string, messageText: string): void {
		window.showErrorMessage(messageText);
		LoggerService.log(namespace, messageText, LogLevel.error);
	}
}
