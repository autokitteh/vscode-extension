import { SessionSectionViewModel } from "@models";

export interface IIncomingSessionsMessagesHandler {
	setSelectedSession(sessionId: string | undefined): void;
	setSessionsSection(sessions: SessionSectionViewModel | undefined): void;
}
