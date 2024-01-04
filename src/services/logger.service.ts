import * as vscode from "vscode";

export class LoggerService {
	private static instance: LoggerService;
	private outputChannel: vscode.OutputChannel;

	private constructor() {
		this.outputChannel = vscode.window.createOutputChannel("autokitteh");
		this.outputChannel.show();
	}

	public static getInstance(): LoggerService {
		if (!LoggerService.instance) {
			LoggerService.instance = new LoggerService();
		}
		return LoggerService.instance;
	}

	public log(message: string): void {
		this.outputChannel.appendLine(`[LOG] ${message}`);
	}

	public error(message: string): void {
		this.outputChannel.appendLine(`[ERROR] ${message}`);
	}

	// You can add more methods for different log levels if needed
}
5;
