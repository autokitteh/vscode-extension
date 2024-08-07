import React, { createContext, ReactNode, useContext, useEffect, useReducer, useState } from "react";

import { Theme } from "@enums";
import { Action } from "@react-types";

type State = {
	modalName: string;
	loading: boolean;
	themeType: Theme;
	delayedLoading: boolean;
	selectedDeploymentId?: string;
};

const AppStateContext = createContext<[State, React.Dispatch<Action>] | undefined>(undefined);

export const appStateReducer = (state: State, action: Action): State => {
	switch (action.type) {
		case "SET_MODAL_NAME":
			return { ...state, modalName: action.payload };
		case "SET_THEME":
			return { ...state, themeType: action.payload };
		case "SET_LOADER":
			return { ...state, loading: action.payload };
		case "SET_SELECTED_DEPLOYMENT":
			return { ...state, selectedDeploymentId: action.payload };
		default:
			return state;
	}
};

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
	const initialState: State = {
		modalName: "",
		loading: false,
		selectedDeploymentId: undefined,
		delayedLoading: false,
		themeType: Theme.DARK,
	};

	const [state, dispatch] = useReducer(appStateReducer, initialState);
	const [delayedLoading, setDelayedLoading] = useState(false);

	useEffect(() => {
		let timeoutId: NodeJS.Timeout | undefined;
		if (state.loading) {
			timeoutId = setTimeout(() => setDelayedLoading(true), 2000);
		} else {
			clearTimeout(timeoutId);
			setDelayedLoading(false);
		}
		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	}, [state.loading]);

	const value: [State, React.Dispatch<Action>] = [{ ...state, delayedLoading }, dispatch];

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
	const stopLoader = () => {
		dispatch({ type: "SET_LOADER", payload: false });
	};
	const startLoader = () => {
		dispatch({ type: "SET_LOADER", payload: true });
	};
	const setModalName = (modalName: string) => {
		dispatch({ type: "SET_MODAL_NAME", payload: modalName });
	};
	const setTheme = (themeType: Theme) => {
		dispatch({ type: "SET_THEME", payload: themeType });
	};

	return {
		stopLoader,
		startLoader,
		setModalName,
		setTheme,
	};
};
