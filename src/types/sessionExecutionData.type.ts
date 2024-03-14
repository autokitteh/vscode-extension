import { SessionEntrypoint } from "@type/models";

export type SessionExecutionData = {
	deploymentId: string;
	sessionInputs: Record<string, any>;
	entrypoint: SessionEntrypoint;
};
