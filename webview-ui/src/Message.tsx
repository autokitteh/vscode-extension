export type MessageType = "COMMON";

export interface Message {
	type: MessageType;
	payload?: any;
}

export interface CommonMessage extends Message {
	type: "COMMON";
	payload: string;
}
