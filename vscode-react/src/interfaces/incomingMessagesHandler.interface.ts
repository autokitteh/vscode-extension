import { Theme } from "@enums";
import { DeploymentSectionViewModel, SessionSectionViewModel } from "@models";
import { Deployment, SessionEntrypoint } from "@type/models";

export interface IIncomingMessagesHandler {
	setThemeVisualType?(themeKind: Theme | undefined): void;
	setProjectName?(projectName: string | undefined): void;
	setResourcesDir?(projectFolder: string): void;
	handleSessionDeletedResponse?: (isDeleted: boolean) => void;
	handleDeploymentDeletedResponse?: (isDeleted: boolean) => void;
	setEntrypoints?: (value: Record<string, SessionEntrypoint[]> | undefined) => void;
	setDeploymentsSection?: (value: DeploymentSectionViewModel | undefined) => void;
	setSelectedDeployment?: (selectDeployment: Deployment | undefined) => void;
	setSelectedSession?: (sessionId: string | undefined) => void;
	setSessionsSection?: (sessions: SessionSectionViewModel | undefined) => void;
	setPathResponse?: (pathResponse: boolean) => void;
}
