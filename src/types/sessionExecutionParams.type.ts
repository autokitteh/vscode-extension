export type SessionExecutionParams = {
	triggerFile: string;
	triggerFunction: string;
	deploymentId: string;
	sessionInputs: Record<string, any>;
};
