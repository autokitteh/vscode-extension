import { MessageType } from "@enums";
import { IIncomingDeploymentsMessagesHandler } from "@react-interfaces";
import { Message } from "@type";

export const HandleDeploymentsIncomingMessages = (
	event: MessageEvent<Message>,
	handlers: IIncomingDeploymentsMessagesHandler
) => {
	const { payload } = event.data as Message;
	switch (event.data.type) {
		case MessageType.setEntrypoints:
			handlers.setEntrypoints(payload as Record<string, string[]>);
			break;
		case MessageType.setExecutionInputs:
			handlers.setExecutionInputs(payload as Record<string, any>);
			break;
		default:
	}
};
