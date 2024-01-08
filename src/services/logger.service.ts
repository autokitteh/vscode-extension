import moment from "moment";
import { window, OutputChannel } from "vscode";

export class LoggerService {
	private static outputChannel: OutputChannel;
	private static loggerNamespace: string = "autokitteh";

	// Static initializer for OutputChannel
	private static initializeOutputChannel() {
		if (!this.outputChannel) {
			this.outputChannel = window.createOutputChannel(this.loggerNamespace);
			this.outputChannel.show();
		}
	}

	public static info(namespace: string, message: string): void {
		this.initializeOutputChannel();
		this.outputChannel.appendLine(
			`${moment().format("YYYY-MM-DD HH:mm:ss")} - [${namespace}] [LOG] ${message}`
		);
	}

	public static debug(namespace: string, message: string): void {
		this.initializeOutputChannel();
		this.outputChannel.appendLine(
			`${moment().format("YYYY-MM-DD HH:mm:ss")} - [${namespace}] [DEBUG] ${message}`
		);
	}

	public static log(namespace: string, message: string): void {
		this.initializeOutputChannel();
		this.outputChannel.appendLine(
			`${moment().format("YYYY-MM-DD HH:mm:ss")} - [${namespace}] [LOG] ${message}`
		);
	}

	public static error(namespace: string, message: string): void {
		this.initializeOutputChannel();
		this.outputChannel.appendLine(
			`${moment().format("YYYY-MM-DD HH:mm:ss")} - [${namespace}] [ERROR] ${message}`
		);
	}
}
