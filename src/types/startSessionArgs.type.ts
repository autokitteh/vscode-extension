import { SessionEntrypoint } from "@type/models";

export type StartSessionArgsType = {
	sessionId?: string;
	deploymentId: string;
	entrypoint: SessionEntrypoint;
};
