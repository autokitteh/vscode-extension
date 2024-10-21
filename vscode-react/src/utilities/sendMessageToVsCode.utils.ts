import { MessageType } from "@enums";
import { vscodeWrapper } from "@react-utilities";
import { Message } from "@type/index";

export const sendMessageToVsCode = (type: MessageType, payload?: any) => {
	vscodeWrapper.postMessage({ payload, type } as Message);
};
