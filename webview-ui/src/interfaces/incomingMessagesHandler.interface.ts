import { Deployment } from "@ak-proto-ts/deployments/v1/deployment_pb";
import { Project } from "@ak-proto-ts/projects/v1/project_pb";
import { Theme } from "@enums/index";

export interface IIncomingMessagesHandler {
	setDeployments(deployments: Deployment[] | undefined): void;
	setThemeVisualType(themeKind: Theme | undefined): void;
	setProject(project: Project | undefined): void;
	setDirectory(directoryPath: string): void;
}
