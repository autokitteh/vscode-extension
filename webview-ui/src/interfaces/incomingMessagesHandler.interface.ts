import { Theme } from "@enums";
import { DeploymentSectionViewModel, SessionSectionViewModel } from "@models";
import { SessionLogViewModel } from "@models/views";

export interface IIncomingMessagesHandler {
	setDeploymentsSection(value: DeploymentSectionViewModel | undefined): void;
	setThemeVisualType(themeKind: Theme | undefined): void;
	setProjectName(projectName: string | undefined): void;
	setSessionsSection(sessions: SessionSectionViewModel | undefined): void;
	setSessionLogsPage(sessions: SessionLogViewModel | undefined): void;
}
