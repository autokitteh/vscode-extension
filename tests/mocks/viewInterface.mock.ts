import { IProjectView } from "@interfaces";
import { vi } from "vitest";

export const mockViewInterface = {
	reveal: vi.fn(),
	delegate: {
		build: vi.fn(),
		onClickSetResourcesDirectory: vi.fn(),
		run: vi.fn(),
	},
	update: vi.fn(),
	onClickSetResourcesDirectory: vi.fn(),
	show: vi.fn(),
	dispose: vi.fn(),
} as IProjectView;
