import { Message, MessageType } from "@type/index";
import { vscodeWrapper } from "@utilities";

export const sendMessage = (type: MessageType, payload?: any) => {
	vscodeWrapper.postMessage({ type, payload } as Message);
};
