import { MessageType } from "@enums";
import { DeploymentSectionViewModel } from "@models";
import { IIncomingDeploymentsMessagesHandler } from "@react-interfaces";
import { Message } from "@type";

export const HandleDeploymentsIncomingMessages = (
	event: MessageEvent<Message>,
	handlers: IIncomingDeploymentsMessagesHandler
) => {
	const { payload } = event.data as Message;
	switch (event.data.type) {
		case MessageType.setDeployments:
			handlers.setDeploymentsSection(payload as DeploymentSectionViewModel);
			break;
		case MessageType.selectDeployment:
			handlers.setSelectedDeploymentId(payload as string);
			break;
		default:
	}
};
