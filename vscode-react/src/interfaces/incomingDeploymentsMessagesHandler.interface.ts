import { DeploymentSectionViewModel } from "@models";

export interface IIncomingDeploymentsMessagesHandler {
	setEntrypoints(value: Record<string, string[]> | undefined): void;
	setExecutionInputs(value: Record<string, any> | undefined): void;
	setDeploymentsSection(value: DeploymentSectionViewModel | undefined): void;
	setSelectedDeploymentId(selectDeploymentId: string | undefined): void;
}
