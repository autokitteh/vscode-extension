import * as vscode from "vscode";
import * as path from "path";

export type MessageType = "RELOAD" | "COMMON";

export interface Message {
	type: MessageType;
	payload?: any;
}

export interface CommonMessage extends Message {
	type: "COMMON";
	payload: string;
}

export interface ReloadMessage extends Message {
	type: "RELOAD";
}
