import { useEffect } from "react";
import { MessageType } from "@enums";
import { IIncomingServerResponsesHandler } from "@react-interfaces";
import { Message } from "@type";

export const useIncomingMessagesFromExtension = (handlers: IIncomingServerResponsesHandler) => {
	useEffect(() => {
		const handleMessagesFromExtension = (event: MessageEvent<Message>) => {
			const { type, payload } = event.data;
			switch (type) {
				case MessageType.deploymentDeletedResponse:
					handlers.handleDeploymentDeletedResponse?.(payload as boolean);
					break;
				case MessageType.deleteSessionResponse:
					handlers.handleSessionDeletedResponse?.(payload as boolean);
					break;
			}
		};

		window.addEventListener("message", handleMessagesFromExtension);
		return () => {
			window.removeEventListener("message", handleMessagesFromExtension);
		};
	}, [handlers]);
};
