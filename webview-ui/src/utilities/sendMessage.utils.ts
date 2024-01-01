import { vscodeWrapper } from "@/utilities";
import { MessageType } from "@enums/index";
import { Message } from "@type/index";

export const sendMessage = (type: MessageType, payload?: any) => {
	vscodeWrapper.postMessage({ type, payload } as Message);
};
