import { SessionEntrypoint } from "@type/models";

export type SessionExecutionData = {
	triggerFile?: string;
	triggerFunction?: string;
	deploymentId: string;
	sessionInputs: Record<string, any>;
	entrypoint: SessionEntrypoint;
};
