import { window } from "vscode";

export class MessageHandler {
	static infoMessage(messageText: string): void {
		window.showInformationMessage(messageText);
	}
	static errorMessage(messageText: string): void {
		window.showErrorMessage(messageText);
	}
}
