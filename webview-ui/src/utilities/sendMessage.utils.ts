import { MessageType } from "@enums";
import { vscodeWrapper } from "@react-utilities";
import { Message } from "@type";

export const sendMessage = (type: MessageType, payload?: any) => {
	vscodeWrapper.postMessage({ type, payload } as Message);
};
