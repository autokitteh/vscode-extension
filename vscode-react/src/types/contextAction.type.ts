import { Theme } from "@enums";

export type Action =
	| { type: "SET_MODAL_NAME"; payload: string }
	| { type: "SET_LOADER"; payload: boolean }
	| { type: "SET_THEME"; payload: Theme }
	| { type: "SET_SELECTED_DEPLOYMENT"; payload: string };
