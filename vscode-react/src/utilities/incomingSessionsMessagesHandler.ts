import { MessageType } from "@enums";
import { SessionSectionViewModel } from "@models";
import { IIncomingSessionsMessagesHandler } from "@react-interfaces";
import { Message } from "@type";

export const HandleSessionsIncomingMessages = (
	event: MessageEvent<Message>,
	handlers: IIncomingSessionsMessagesHandler
) => {
	const { payload } = event.data as Message;
	switch (event.data.type) {
		case MessageType.setSessionsSection:
			handlers.setSessionsSection(payload as SessionSectionViewModel);
			break;
		case MessageType.selectSession:
			handlers.setSelectedSession(payload as string);
			break;
		default:
	}
};
