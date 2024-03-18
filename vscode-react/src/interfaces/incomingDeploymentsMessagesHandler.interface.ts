import { DeploymentSectionViewModel } from "@models";
import { SessionExecutionForView } from "@type/views";

export interface IIncomingDeploymentsMessagesHandler {
	setEntrypoints(value: SessionExecutionForView | undefined): void;
	setDeploymentsSection(value: DeploymentSectionViewModel | undefined): void;
	setSelectedDeploymentId(selectDeploymentId: string | undefined): void;
}
