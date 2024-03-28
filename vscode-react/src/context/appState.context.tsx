import React, { createContext, useContext, useReducer } from "react";
import { Deployment } from "@type/models";

type State = {
	modalName: string;
	lastDeployment: Deployment | null;
};

type Action = { type: "SET_MODAL_NAME"; payload: string } | { type: "SET_LAST_DEPLOYMENT"; payload: Deployment };

const AppStateContext = createContext<[State, React.Dispatch<Action>] | undefined>(undefined);

const appStateReducer = (state: State, action: Action): State => {
	switch (action.type) {
		case "SET_MODAL_NAME":
			return { ...state, modalName: action.payload };
		case "SET_LAST_DEPLOYMENT":
			return { ...state, lastDeployment: action.payload };
		default:
			return state;
	}
};

export const AppStateProvider = ({ children }: { children: React.ReactNode }) => {
	const initialState: State = { modalName: "", lastDeployment: null };
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
