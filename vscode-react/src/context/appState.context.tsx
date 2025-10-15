import { Theme } from "@enums";
import { Action } from "@react-types";
import React, { ReactNode, createContext, useCallback, useContext, useMemo, useReducer } from "react";

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

	const value = useMemo<[State, React.Dispatch<Action>]>(() => [state, dispatch], [state]);

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

	const stopLoader = useCallback(() => {
		dispatch({ payload: false, type: "SET_LOADER" });
	}, [dispatch]);

	const startLoader = useCallback(() => {
		dispatch({ payload: true, type: "SET_LOADER" });
	}, [dispatch]);

	const setModalName = useCallback(
		(modalName: string) => {
			dispatch({ payload: modalName, type: "SET_MODAL_NAME" });
		},
		[dispatch]
	);

	const setTheme = useCallback(
		(themeType: Theme) => {
			dispatch({ payload: themeType, type: "SET_THEME" });
		},
		[dispatch]
	);

	return useMemo(
		() => ({
			setModalName,
			setTheme,
			startLoader,
			stopLoader,
		}),
		[setModalName, setTheme, startLoader, stopLoader]
	);
};
