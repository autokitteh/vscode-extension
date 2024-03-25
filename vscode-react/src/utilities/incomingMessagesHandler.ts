import { MessageType, Theme } from "@enums";
import { IIncomingMessagesHandler } from "@react-interfaces";
import { Message } from "@type";

export const HandleIncomingMessages = (event: MessageEvent<Message>, handlers: IIncomingMessagesHandler) => {
	const { payload } = event.data as Message;
	switch (event.data.type) {
		case MessageType.setTheme:
			handlers.setThemeVisualType(payload as Theme);
			break;
		case MessageType.setProjectName:
			handlers.setProjectName(payload as string);
			break;
		case MessageType.setResourcesDirState:
			handlers.setResourcesDirState(payload as boolean);
			break;
		default:
	}
};
