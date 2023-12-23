import { Deployment } from "@ak-proto-ts/deployments/v1/deployment_pb";
import { Session } from "@ak-proto-ts/sessions/v1/session_pb";
import { Theme } from "@enums/index";
import { IIncomingMessagesHandler } from "@interfaces";
import { Message, MessageType } from "@type/index";

export const HandleIncomingMessages = (
	event: MessageEvent<Message>,
	handlers: IIncomingMessagesHandler
) => {
	const { payload } = event.data as Message;

	switch (event.data.type) {
		case MessageType.sessions:
			handlers.setSessions(payload as Session[]);
			break;
		case MessageType.theme:
			handlers.setThemeVisualType(payload as Theme);
			break;
		case MessageType.deployments:
			handlers.setDeployments(payload as Deployment[]);
			break;
		case MessageType.project:
			handlers.setProjectName(payload as string);
			break;
		default:
	}
};
