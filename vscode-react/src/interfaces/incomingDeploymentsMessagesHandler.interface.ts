import { DeploymentSectionViewModel } from "@models";
import { EntrypointTrigger } from "@type/models";

export interface IIncomingDeploymentsMessagesHandler {
	setEntrypoints(value: EntrypointTrigger | undefined): void;
	setDeploymentsSection(value: DeploymentSectionViewModel | undefined): void;
	setSelectedDeploymentId(selectDeploymentId: string | undefined): void;
}
