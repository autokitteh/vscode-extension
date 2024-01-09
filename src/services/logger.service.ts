import moment from "moment";
import { window, OutputChannel } from "vscode";

export class LoggerService {
	private static outputChannels: { [key: string]: OutputChannel } = {};
	private static defaultChannelName: string = "autokitteh-logs";

	private static initializeOutputChannel(channelName: string = LoggerService.defaultChannelName) {
		if (!this.outputChannels[channelName]) {
			this.outputChannels[channelName] = window.createOutputChannel(channelName);
			this.outputChannels[channelName].show();
		}
	}
	public static clearOutputChannel(channelName: string = LoggerService.defaultChannelName) {
		if (this.outputChannels[channelName]) {
			this.outputChannels[channelName].clear();
		}
	}

	public static info(
		namespace: string,
		message: string,
		channelName: string = LoggerService.defaultChannelName
	): void {
		this.initializeOutputChannel(channelName);
		this.outputChannels[channelName].appendLine(
			`${moment().format("YYYY-MM-DD HH:mm:ss")} - [${namespace}] [LOG] ${message}`
		);
	}

	public static print(channelName: string, namespace: string, message: string): void {
		this.initializeOutputChannel(channelName);
		this.outputChannels[channelName].appendLine(`[${namespace}] - ${message}`);
	}

	public static debug(
		namespace: string,
		message: string,
		channelName: string = LoggerService.defaultChannelName
	): void {
		this.initializeOutputChannel(channelName);
		this.outputChannels[channelName].appendLine(
			`${moment().format("YYYY-MM-DD HH:mm:ss")} - [${namespace}] [DEBUG] ${message}`
		);
	}

	public static log(
		namespace: string,
		message: string,
		channelName: string = LoggerService.defaultChannelName
	): void {
		this.initializeOutputChannel(channelName);
		this.outputChannels[channelName].appendLine(
			`${moment().format("YYYY-MM-DD HH:mm:ss")} - [${namespace}] [LOG] ${message}`
		);
	}

	public static error(
		namespace: string,
		message: string,
		channelName: string = LoggerService.defaultChannelName
	): void {
		this.initializeOutputChannel(channelName);
		this.outputChannels[channelName].appendLine(
			`${moment().format("YYYY-MM-DD HH:mm:ss")} - [${namespace}] [ERROR] ${message}`
		);
	}
}
