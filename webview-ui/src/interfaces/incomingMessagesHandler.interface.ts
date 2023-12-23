import { Deployment } from "@parent-ak-proto-ts/deployments/v1/deployment_pb";
import { Theme } from "@parent-enums/index";

export interface IIncomingMessagesHandler {
	setDeployments(deployments: Deployment[] | undefined): void;
	setThemeVisualType(themeKind: Theme | undefined): void;
	setProjectName(project: string | undefined): void;
	setDirectory(directoryPath: string): void;
}
