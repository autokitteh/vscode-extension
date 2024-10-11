import { Theme } from "@enums";
import { Action } from "@react-types";
import React, { ReactNode, createContext, useContext, useReducer } from "react";

type State = {
	loading: boolean;
	modalName: string;
	selectedDeploymentId?: string;
	themeType: Theme;
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
		loading: false,
		modalName: "",
		selectedDeploymentId: undefined,
		themeType: Theme.DARK,
	};

	const [state, dispatch] = useReducer(appStateReducer, initialState);

	const value: [State, React.Dispatch<Action>] = [{ ...state }, dispatch];

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
		dispatch({ payload: false, type: "SET_LOADER" });
	};
	const startLoader = () => {
		dispatch({ payload: true, type: "SET_LOADER" });
	};
	const setModalName = (modalName: string) => {
		dispatch({ payload: modalName, type: "SET_MODAL_NAME" });
	};
	const setTheme = (themeType: Theme) => {
		dispatch({ payload: themeType, type: "SET_THEME" });
	};

	return {
		setModalName,
		setTheme,
		startLoader,
		stopLoader,
	};
};
