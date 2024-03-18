import { create } from "zustand";

interface ModalState {
	modals: { [key: string]: boolean };
	showModal: (modalName: string) => void;
	hideModal: (modalName: string) => void;
}

export const useModals = create<ModalState>((set) => ({
	modals: {},
	showModal: (modalName: string) =>
		set((state) => ({
			modals: {
				...state.modals,
				[modalName]: true,
			},
		})),

	hideModal: (modalName: string) =>
		set((state) => {
			const newState = { ...state.modals };
			delete newState[modalName];
			return { modals: newState };
		}),
}));
