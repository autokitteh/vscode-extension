import React, { createContext, ReactNode, useContext, useReducer } from "react";
import { MessageType } from "@enums";
import { Deployment } from "@type/models";
import { Action } from "src/types";

type State = {
	modalName: string;
	lastDeployment: Deployment | null;
	loading: Set<MessageType>;
};

const AppStateContext = createContext<[State, React.Dispatch<Action>] | undefined>(undefined);

export const appStateReducer = (state: State, action: Action): State => {
	switch (action.type) {
		case "SET_MODAL_NAME":
			return { ...state, modalName: action.payload };
		case "SET_LAST_DEPLOYMENT":
			return { ...state, lastDeployment: action.payload };
		case "START_LOADER":
			return { ...state, loading: new Set(state.loading).add(action.payload) };
		case "STOP_LOADER":
			const newLoading = new Set(state.loading);
			newLoading.delete(action.payload);
			return { ...state, loading: newLoading };
		default:
			return state;
	}
};

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
	const initialState: State = {
		modalName: "",
		lastDeployment: null,
		loading: new Set([MessageType.openProjectInNewWindow, MessageType.getDeployments, MessageType.getSessions]),
	};

	const [state, dispatch] = useReducer(appStateReducer, initialState);
	const value: [State, React.Dispatch<Action>] = [state, dispatch];
	return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};

export const useAppState = () => {
	const context = useContext(AppStateContext);
	if (context === undefined) {
		throw new Error("useAppState must be used within an AppStateProvider");
	}
	return context;
};

export const useAppDispatch = () => {
	const [, dispatch] = useAppState();
	const stopLoader = (loader: MessageType) => {
		dispatch({ type: "STOP_LOADER", payload: loader });
	};
	const startLoader = (loader: MessageType) => {
		dispatch({ type: "START_LOADER", payload: loader });
	};
	const setModalName = (modalName: string) => {
		dispatch({ type: "SET_MODAL_NAME", payload: modalName });
	};

	return {
		stopLoader,
		startLoader,
		setModalName,
	};
};
