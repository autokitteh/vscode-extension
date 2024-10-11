import { describe, expect, it } from "vitest";

import { appStateReducer } from "../../src/context/appState.context";
import { Action } from "../../src/types/contextAction.type";

describe("appStateReducer", () => {
	it("handle SET_MODAL_NAME", () => {
		const initialState = { lastDeployment: null, loading: false, modalName: "", themeType: "light" }; // Assuming "light" is a valid Theme value
		const action = { payload: "Modal1", type: "SET_MODAL_NAME" };
		const state = appStateReducer(initialState, action as Action);
		expect(state.modalName).toBe("Modal1");
	});
});
