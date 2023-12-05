export type MessageType = "COMMON" | "THEME";

export interface Message {
	type: MessageType;
	payload?: any;
}

export interface CommonMessage extends Message {
	type: "COMMON";
	payload: string;
}
export interface ThemeMessage extends Message {
	type: "THEME";
	payload: number;
}
