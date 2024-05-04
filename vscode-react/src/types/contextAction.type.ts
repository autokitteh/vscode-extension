import { MessageType } from "@enums";
import { Deployment } from "@type/models";

export type Action =
	| { type: "SET_MODAL_NAME"; payload: string }
	| { type: "SET_LAST_DEPLOYMENT"; payload: Deployment }
	| { type: "START_LOADER"; payload: MessageType }
	| { type: "STOP_LOADER"; payload: MessageType };
