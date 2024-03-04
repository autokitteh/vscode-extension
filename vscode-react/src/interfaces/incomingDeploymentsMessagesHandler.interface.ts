export interface IIncomingDeploymentsMessagesHandler {
	setEntrypoints(value: Record<string, string[]> | undefined): void;
	setExecutionInputs(value: Record<string, any> | undefined): void;
}
