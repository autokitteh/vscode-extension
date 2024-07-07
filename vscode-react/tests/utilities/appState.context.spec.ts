import { describe, it, expect } from "vitest";

import { appStateReducer } from "../../src/context/appState.context";
import { Action } from "../../src/types/contextAction.type";

describe("appStateReducer", () => {
	it("should handle SET_MODAL_NAME", () => {
		const initialState = { modalName: "", lastDeployment: null, loading: false };
		const action = { type: "SET_MODAL_NAME", payload: "Modal1" };
		const state = appStateReducer(initialState, action as Action);
		expect(state.modalName).toBe("Modal1");
	});
});
