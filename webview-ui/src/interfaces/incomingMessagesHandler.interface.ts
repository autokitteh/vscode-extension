import { Session } from "@ak-proto-ts/sessions/v1/session_pb";
import { Theme } from "@enums/index";
import { Deployment } from "@type/models/index";

export interface IIncomingMessagesHandler {
	setDeployments(deployments: Deployment[] | undefined): void;
	setThemeVisualType(themeKind: Theme | undefined): void;
	setProjectName(projectName: string | undefined): void;
	setSessions(sessions: Session[] | undefined): void;
}
