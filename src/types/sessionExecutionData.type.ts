import { SessionEntrypoint } from "@type/models";

export type SessionExecutionData = {
	sessionId?: string;
	deploymentId: string;
	entrypoint: SessionEntrypoint;
};
