export type SessionExecutionData = {
	triggerFile: string;
	triggerFunction: string;
	deploymentId: string;
	sessionInputs: Record<string, any>;
};
