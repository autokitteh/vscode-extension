import React, { createContext, useContext, useReducer } from "react";
import { Deployment } from "@type/models";
import { Action } from "src/types";

type State = {
	modalName: string;
	lastDeployment: Deployment | null;
	activeDeploymentId: string | null;
	selectedDeploymentId: string | null;
};

const AppStateContext = createContext<[State, React.Dispatch<Action>] | undefined>(undefined);

export const appStateReducer = (state: State, action: Action): State => {
	switch (action.type) {
		case "SET_MODAL_NAME":
			return { ...state, modalName: action.payload };
		case "SET_LAST_DEPLOYMENT":
			return { ...state, lastDeployment: action.payload };
		case "SET_ACTIVE_DEPLOYMENT_ID":
			return { ...state, activeDeploymentId: action.payload };
		case "SET_SELECTED_DEPLOYMENT_ID":
			return { ...state, selectedDeploymentId: action.payload };
		default:
			return state;
	}
};

export const AppStateProvider = ({ children }: { children: React.ReactNode }) => {
	const initialState: State = {
		modalName: "",
		lastDeployment: null,
		activeDeploymentId: null,
		selectedDeploymentId: null,
	};
	const value = useReducer(appStateReducer, initialState);

	return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};

export const useAppState = () => {
	const context = useContext(AppStateContext);
	if (context === undefined) {
		throw new Error("useAppState must be used within an AppStateProvider");
	}
	return context;
};
