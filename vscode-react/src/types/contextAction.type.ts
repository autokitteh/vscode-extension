import { Theme } from "@enums";

export type Action =
	| { payload: string; type: "SET_MODAL_NAME" }
	| { payload: boolean; type: "SET_LOADER" }
	| { payload: Theme; type: "SET_THEME" }
	| { payload: string; type: "SET_SELECTED_DEPLOYMENT" };
