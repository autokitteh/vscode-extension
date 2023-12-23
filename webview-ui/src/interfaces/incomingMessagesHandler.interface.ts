import { Deployment } from "@ak-proto-ts/deployments/v1/deployment_pb";
import { Session } from "@ak-proto-ts/sessions/v1/session_pb";
import { Theme } from "@enums/index";

export interface IIncomingMessagesHandler {
	setDeployments(deployments: Deployment[] | undefined): void;
	setThemeVisualType(themeKind: Theme | undefined): void;
	setProjectName(project: string | undefined): void;
	setSessions(sessions: Session[] | undefined): void;
}
