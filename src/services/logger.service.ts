import * as vscode from "vscode";
import  moment from "moment"

export class LoggerService {
	private static instance: LoggerService;
	private outputChannel: vscode.OutputChannel;
	private loggerNamespace: string = "autokitteh";

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

	public log(namespace: string, message: string): void {
		this.outputChannel.appendLine(`${moment().format("YYYY-MM-DD HH:mm:ss")} - [${namespace}] [LOG] ${message}`);
	}

	public error(namespace: string, message: string): void {
		this.outputChannel.appendLine(`${moment().format("YYYY-MM-DD HH:mm:ss")} - [${namespace}] [ERROR] ${message}`);
	}
}
