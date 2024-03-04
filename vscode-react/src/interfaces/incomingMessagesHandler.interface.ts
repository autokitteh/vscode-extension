import { Theme } from "@enums";

export interface IIncomingMessagesHandler {
	setThemeVisualType(themeKind: Theme | undefined): void;
	setProjectName(projectName: string | undefined): void;
	setResourcesDirState(projectFolder: boolean): void;
}
