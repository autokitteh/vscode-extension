import { Deployment } from "@type/models";

export type Action =
	| { type: "SET_MODAL_NAME"; payload: string }
	| { type: "SET_LAST_DEPLOYMENT"; payload: Deployment }
	| { type: "SET_SELECTED_DEPLOYMENT"; payload: Deployment }
	| { type: "SET_ACTIVE_DEPLOYMENT_ID"; payload: string };
