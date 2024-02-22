import { MessageType, Theme } from "@enums";
import { DeploymentSectionViewModel, SessionSectionViewModel } from "@models";
import { IIncomingMessagesHandler } from "@react-interfaces";
import { Message } from "@type";

export const HandleIncomingMessages = (event: MessageEvent<Message>, handlers: IIncomingMessagesHandler) => {
	const { payload } = event.data as Message;
	switch (event.data.type) {
		case MessageType.setTheme:
			handlers.setThemeVisualType(payload as Theme);
			break;
		case MessageType.setDeployments:
			handlers.setDeploymentsSection(payload as DeploymentSectionViewModel);
			break;
		case MessageType.setProjectName:
			handlers.setProjectName(payload as string);
			break;
		case MessageType.setSessionsSection:
			handlers.setSessionsSection(payload as SessionSectionViewModel);
			break;
		case MessageType.selectDeployment:
			handlers.setSelectedDeploymentId(payload as string);
		case MessageType.setResourcesDirState:
			handlers.setResourcesDirState(payload as boolean);
		default:
	}
};
