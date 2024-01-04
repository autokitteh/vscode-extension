import { LoggerService } from "@services";
import { window } from "vscode";

export class MessageHandler {
	static infoMessage(messageText: string): void {
		window.showInformationMessage(messageText);
		LoggerService.getInstance().log(messageText);
	}
	static errorMessage(messageText: string): void {
		window.showErrorMessage(messageText);
		LoggerService.getInstance().error(messageText);
	}
}
