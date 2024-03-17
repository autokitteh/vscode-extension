import { MessageType } from "@enums";
import { IIncomingDeploymentsMessagesHandler } from "@react-interfaces";
import { Message } from "@type";

export const HandleIncomingDeploymentsMessages = (
	event: MessageEvent<Message>,
	handlers: IIncomingDeploymentsMessagesHandler
) => {
	const { payload } = event.data as Message;
	switch (event.data.type) {
		case MessageType.deploymentDeletedResponse:
			handlers.handleDeploymentDeletedResponse(payload as boolean);
			break;
		default:
	}
};
