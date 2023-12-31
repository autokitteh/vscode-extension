import { Session } from "@ak-proto-ts/sessions/v1/session_pb";
import { MessageType, Theme } from "@enums/index";
import { IIncomingMessagesHandler } from "@interfaces";
<<<<<<< HEAD
import { Message } from "@type/index";
=======
import { Message, MessageType } from "@type/index";
import { Deployment } from "@type/models";
>>>>>>> 979676f (feat: transform proto deployments to autokitteh models)

export const HandleIncomingMessages = (
	event: MessageEvent<Message>,
	handlers: IIncomingMessagesHandler
) => {
	const { payload } = event.data as Message;

	switch (event.data.type) {
		case MessageType.setTheme:
			handlers.setThemeVisualType(payload as Theme);
			break;
		case MessageType.setDeployments:
			handlers.setDeployments(payload as Deployment[]);
			break;
		case MessageType.setProjectName:
			handlers.setProjectName(payload as string);
			break;
		case MessageType.setSessions:
			handlers.setSessions(payload as Session[]);
		default:
	}
};
