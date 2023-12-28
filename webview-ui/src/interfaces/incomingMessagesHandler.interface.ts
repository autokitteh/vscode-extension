import { Deployment } from "@ak-proto-ts/deployments/v1/deployment_pb";
import { Theme } from "@enums/index";
import { Session } from "@type/models/index";

export interface IIncomingMessagesHandler {
	setDeployments(deployments: Deployment[] | undefined): void;
	setThemeVisualType(themeKind: Theme | undefined): void;
	setProjectName(projectName: string | undefined): void;
	setSessions(sessions: Session[] | undefined): void;
}
