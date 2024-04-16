import { channels } from "@constants";
import { LoggerLevel } from "@enums";
import { format } from "date-fns";
import { window, OutputChannel } from "vscode";

export class LoggerService {
	private static outputChannels: { [key: string]: OutputChannel } = {};
	private static defaultChannelName: string = channels.appOutputLogName;

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

	private static output(
		namespace: string,
		message: string,
		channelName: string = LoggerService.defaultChannelName,
		level: string = LoggerLevel.info
	): void {
		this.initializeOutputChannel(channelName);

		this.outputChannels[channelName].appendLine(
			`${format(new Date(), "yyyy-MM-dd HH:mm:ss")} - [${namespace}] [${level}] ${message}`
		);
	}

	public static info(namespace: string, message: string, channelName: string = LoggerService.defaultChannelName): void {
		this.output(namespace, message, channelName);
	}

	public static error(
		namespace: string,
		message: string,
		channelName: string = LoggerService.defaultChannelName
	): void {
		this.output(namespace, message, channelName, LoggerLevel.error);
	}

	public static debug(
		namespace: string,
		message: string,
		channelName: string = LoggerService.defaultChannelName
	): void {
		this.initializeOutputChannel(channelName);

		this.output(namespace, message, channelName, LoggerLevel.debug);
	}

	public static sessionLog(message: string): void {
		this.initializeOutputChannel(channels.appOutputSessionsLogName);

		this.outputChannels[channels.appOutputSessionsLogName].appendLine(message);
	}

	public static reveal(channelName: string = LoggerService.defaultChannelName) {
		this.outputChannels[channelName].show();
	}
}
