import { Theme } from "@enums";
import { DeploymentSectionViewModel } from "@models";
import { Session } from "@type/models";

export interface IIncomingMessagesHandler {
	setDeploymentsSection(value: DeploymentSectionViewModel | undefined): void;
	setThemeVisualType(themeKind: Theme | undefined): void;
	setProjectName(projectName: string | undefined): void;
	setSessions(sessions: Session[] | undefined): void;
}
