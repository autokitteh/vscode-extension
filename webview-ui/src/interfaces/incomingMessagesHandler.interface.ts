import { Theme } from "@enums";
import { Session } from "@type/models";
import { DeploymentSectionViewType } from "@type/views";

export interface IIncomingMessagesHandler {
	setDeploymentsSection(value: DeploymentSectionViewType | undefined): void;
	setThemeVisualType(themeKind: Theme | undefined): void;
	setProjectName(projectName: string | undefined): void;
	setSessions(sessions: Session[] | undefined): void;
}
