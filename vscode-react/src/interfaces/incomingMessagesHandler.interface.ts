import { Theme } from "@enums";
import { DeploymentSectionViewModel, SessionSectionViewModel } from "@models";
import { Connection } from "@type/models";

export interface IIncomingMessagesHandler {
	setTheme?(theme?: Theme): void;
	setProjectName?(projectName?: string): void;
	setResourcesDir?(projectFolder: string): void;
	setEntrypoints?: (value?: string[]) => void;
	startLoader?: () => void;
	stopLoader?: () => void;
	setDeploymentsSection?: (value?: DeploymentSectionViewModel) => void;
	setSelectedDeploymentId?: (selectDeploymentId?: string) => void;
	setSelectedSession?: (sessionId?: string) => void;
	setSessionsSection?: (sessions?: SessionSectionViewModel) => void;
	setPathResponse?: (pathResponse: boolean) => void;
	setRetryCountdown?: (countdown: string) => void;
	setConnections?: (connections: Connection[]) => void;
}
