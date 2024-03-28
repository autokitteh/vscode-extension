import { Theme } from "@enums";
import { DeploymentSectionViewModel } from "@models";
import { SessionEntrypoint } from "@type/models";

export interface IIncomingMessagesHandler {
	setThemeVisualType(themeKind: Theme | undefined): void;
	setProjectName(projectName: string | undefined): void;
	setResourcesDirState(projectFolder: boolean): void;
}
export interface IIncomingServerResponsesHandler {
	handleSessionDeletedResponse?: (isDeleted: boolean) => void;
	handleDeploymentDeletedResponse?: (isDeleted: boolean) => void;
}

export interface IIncomingDeploymentsHandler {
	setEntrypoints(value: Record<string, SessionEntrypoint[]> | undefined): void;
	setDeploymentsSection(value: DeploymentSectionViewModel | undefined): void;
	setSelectedDeploymentId(selectDeploymentId: string | undefined): void;
}
