import { MessageType, Theme } from "@enums";
import { IIncomingMessagesHandler } from "@react-interfaces";
import { Message } from "@type";
import { Session } from "@type/models";
import { DeploymentSectionViewType } from "@type/views";

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
			handlers.setDeploymentsSection(payload as DeploymentSectionViewType);
			break;
		case MessageType.setProjectName:
			handlers.setProjectName(payload as string);
			break;
		case MessageType.setSessions:
			handlers.setSessions(payload as Session[]);
		default:
	}
};
