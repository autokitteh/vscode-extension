import { MessageType, Theme } from "@enums";
import { IIncomingMessagesHandler, IIncomingServerResponsesHandler } from "@react-interfaces";
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

export const HandleIncomingServerResponses = (
	event: MessageEvent<Message>,
	handlers: IIncomingServerResponsesHandler
) => {
	const { payload } = event.data as Message;
	switch (event.data.type) {
		case MessageType.deploymentDeletedResponse:
			handlers.handleDeploymentDeletedResponse(payload as boolean);
			break;
		default:
	}
};
