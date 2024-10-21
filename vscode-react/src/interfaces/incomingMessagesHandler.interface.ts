/* eslint-disable @typescript-eslint/member-ordering */
import { Theme } from "@enums";
import { DeploymentSectionViewModel, SessionSectionViewModel } from "@models";
import { Connection } from "@type/models";

export interface IIncomingMessagesHandler {
	setConnections?: (connections: Connection[]) => void;
	setDeploymentsSection?: (value?: DeploymentSectionViewModel) => void;
	setEntrypoints?: (value?: string[]) => void;
	setPathResponse?: (pathResponse: boolean) => void;
	setProjectName?(projectName?: string): void;
	setResourcesDir?(projectFolder: string): void;
	setRetryCountdown?: (countdown: string) => void;
	setSelectedDeploymentId?: (selectDeploymentId?: string) => void;
	setSelectedSession?: (sessionId?: string) => void;
	setSessionsSection?: (sessions?: SessionSectionViewModel) => void;
	setTheme?(theme?: Theme): void;
	startLoader?: () => void;
	stopLoader?: () => void;
}
