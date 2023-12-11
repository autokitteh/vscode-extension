export enum MessageType {
	common = "COMMON",
	theme = "THEME",
}

export type Message = {
	type: MessageType;
	payload?: string | object | number;
};
