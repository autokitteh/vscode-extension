import { Theme } from "@enums";
import { DeploymentSectionViewModel, SessionSectionViewModel } from "@models";

export interface IIncomingMessagesHandler {
	setDeploymentsSection(value: DeploymentSectionViewModel | undefined): void;
	setThemeVisualType(themeKind: Theme | undefined): void;
	setProjectName(projectName: string | undefined): void;
	setSessionsSection(sessions: SessionSectionViewModel | undefined): void;
	setSelectedDeploymentId(selectDeploymentId: string | undefined): void;
	setSelectedSessionId(selectSessionId: string | undefined): void;
	setResourcesDirState(projectFolder: boolean): void;
	setEntrypoints(entrypoints: Record<string, string[]>): void;
	setExecutionInputs(executionInputs: Record<string, any>): void;
}
