import { DeploymentSectionViewModel } from "@models";
import { SessionEntrypoint } from "@type/models";

export interface IIncomingMessagesDeploymentsHandler {
	setEntrypoints(value: Record<string, SessionEntrypoint[]> | undefined): void;
	setDeploymentsSection(value: DeploymentSectionViewModel | undefined): void;
	setSelectedDeploymentId(selectDeploymentId: string | undefined): void;
}
