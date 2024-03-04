import { Theme } from "@enums";
import { SessionSectionViewModel } from "@models";

export interface IIncomingMessagesHandler {
	setThemeVisualType(themeKind: Theme | undefined): void;
	setProjectName(projectName: string | undefined): void;
	setSessionsSection(sessions: SessionSectionViewModel | undefined): void;
	setSelectedSessionId(selectSessionId: string | undefined): void;
	setResourcesDirState(projectFolder: boolean): void;
}
