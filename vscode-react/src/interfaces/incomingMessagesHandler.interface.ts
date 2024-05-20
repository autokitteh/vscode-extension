import { Theme } from "@enums";
import { DeploymentSectionViewModel, SessionSectionViewModel } from "@models";
import { SessionEntrypoint } from "@type/models";

export interface IIncomingMessagesHandler {
	setThemeVisualType?(themeKind: Theme | undefined): void;
	setProjectName?(projectName: string | undefined): void;
	setResourcesDir?(projectFolder: string): void;
	setEntrypoints?: (value: Record<string, SessionEntrypoint[]> | undefined) => void;
	startLoader?: () => void;
	stopLoader?: () => void;
	setDeploymentsSection?: (value: DeploymentSectionViewModel | undefined) => void;
	setSelectedDeploymentId?: (selectDeploymentId: string | undefined) => void;
	setSelectedSession?: (sessionId: string | undefined) => void;
	setSessionsSection?: (sessions: SessionSectionViewModel | undefined) => void;
	setPathResponse?: (pathResponse: boolean) => void;
	setRetryCountdown?: (countdown: string) => void;
}
