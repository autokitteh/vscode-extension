import { Theme } from "@enums";
import { DeploymentSectionViewModel, SessionSectionViewModel } from "@models";
import { Connection } from "@type/models";

export interface IIncomingMessagesHandler {
<<<<<<< HEAD
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
=======
	setProjectName?(projectName: string | undefined): void;
	setResourcesDir?(projectFolder: string): void;
	setTheme?(theme: Theme | undefined): void;
	setConnections?: (connections: Connection[]) => void;
	setDeploymentsSection?: (value: DeploymentSectionViewModel | undefined) => void;
	setEntrypoints?: (value: Record<string, SessionEntrypoint[]> | undefined) => void;
	setPathResponse?: (pathResponse: boolean) => void;
	setRetryCountdown?: (countdown: string) => void;
	setSelectedDeploymentId?: (selectDeploymentId: string | undefined) => void;
	setSelectedSession?: (sessionId: string | undefined) => void;
	setSessionsSection?: (sessions: SessionSectionViewModel | undefined) => void;
	startLoader?: () => void;
	stopLoader?: () => void;
>>>>>>> e2d1b815 (feat: add liferay and perfectionist plugin to eslint of react app)
}
