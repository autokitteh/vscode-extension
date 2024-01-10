import { channels } from "@constants";
import { LoggerLevel } from "@enums";
import moment from "moment";
import { window, OutputChannel } from "vscode";

export class LoggerService {
	private static outputChannels: { [key: string]: OutputChannel } = {};
	private static defaultChannelName: string = channels.appOutputLogName;
	private static defaultSessionsChannelName: string = channels.appOutputSessionsLogName;

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

		this.outputChannels[channelName].appendLine(
			`${moment().format("YYYY-MM-DD HH:mm:ss")} - [${namespace}] [${level}] ${message}`
		);
	}

	public static print(namespace: string, message: string): void {
		this.initializeOutputChannel(this.defaultSessionsChannelName);

		this.outputChannels[this.defaultSessionsChannelName].appendLine(`[${namespace}]: ${message}`);
	}
}
