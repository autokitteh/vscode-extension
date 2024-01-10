import { LoggerLevel } from "@enums";
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

	public static log(
		namespace: string,
		message: string,
		channelName: string = LoggerService.defaultChannelName,
		level: string = LoggerLevel.info
	): void {
		this.initializeOutputChannel(channelName);
		if (level === LoggerLevel.print) {
			this.outputChannels[channelName].appendLine(`[${namespace}]: ${message}`);
			return;
		}
		this.outputChannels[channelName].appendLine(
			`${moment().format("YYYY-MM-DD HH:mm:ss")} - [${namespace}] [${level}] ${message}`
		);
	}
}
