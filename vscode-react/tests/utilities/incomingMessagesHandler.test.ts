import { MessageType, Theme } from "@enums";
import { IIncomingMessagesHandler } from "@react-interfaces";
import { HandleIncomingMessages } from "@react-utilities";
import { Message } from "@type";
import { describe, it, expect, vi } from "vitest";

describe("HandleIncomingMessages", () => {
	it("handles setTheme MessageType correctly", () => {
		const mockHandler = {
			setThemeVisualType: vi.fn(),
		};

		const messageEvent = {
			data: {
				type: MessageType.setTheme,
				payload: Theme.DARK,
			},
		};

		HandleIncomingMessages(
			messageEvent as unknown as MessageEvent<Message>,
			mockHandler as unknown as IIncomingMessagesHandler
		);

		expect(mockHandler.setThemeVisualType).toHaveBeenCalledWith(Theme.DARK);
	});
});
