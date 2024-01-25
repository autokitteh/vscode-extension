import { channels } from "@constants";
import { LoggerLevel } from "@enums";
import moment from "moment";
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
			`${moment().format("YYYY-MM-DD HH:mm:ss")} - [${namespace}] [${level}] ${message}`
		);
	}

	public static info(
		namespace: string,
		message: string,
		channelName: string = LoggerService.defaultChannelName
	): void {
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

	public static warn(
		namespace: string,
		message: string,
		channelName: string = LoggerService.defaultChannelName
	): void {
		this.initializeOutputChannel(channelName);

		this.output(namespace, message, channelName, LoggerLevel.warn);
	}

	public static print(namespace: string, message: string, channelName: string): void {
		this.initializeOutputChannel(channelName);

		this.outputChannels[channelName].appendLine(`[${namespace}]: ${message}`);
	}

	public static printError(namespace: string, message: string, channelName: string): void {
		this.initializeOutputChannel(channelName);

		this.outputChannels[channelName].appendLine(`Error: [${namespace}]: ${message}`);
	}
}
