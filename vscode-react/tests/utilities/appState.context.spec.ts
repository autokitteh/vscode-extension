import { describe, it, expect } from "vitest";
import { Deployment } from "../../../src/types/models";
import { appStateReducer, Action } from "../../src/context/appState.context"; // Adjust the import path

const mockDeployment: Deployment = {
	deploymentId: "testId",
	envId: "testEnvironment",
	buildId: "testBuildId",
	createdAt: new Date(),
	state: 1,
};

describe("appStateReducer", () => {
	it("should handle SET_MODAL_NAME", () => {
		const initialState = { modalName: "", lastDeployment: null };
		const action = { type: "SET_MODAL_NAME", payload: "Modal1" };
		const state = appStateReducer(initialState, action as Action);
		expect(state.modalName).toBe("Modal1");
	});

	it("should handle SET_LAST_DEPLOYMENT", () => {
		const initialState = { modalName: "", lastDeployment: null };
		const action = { type: "SET_LAST_DEPLOYMENT" as const, payload: mockDeployment };
		const state = appStateReducer(initialState, action as Action);
		expect(state.lastDeployment).toBe(mockDeployment);
	});
});
