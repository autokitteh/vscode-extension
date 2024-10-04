import { SessionEntrypoint } from "@type/models";

export type UIStartSessionArgsType = {
	sessionId?: string;
	deploymentId: string;
	buildId: string;
	fileName: string;
	functionName: string;
	inputParameters: { key: string; value: string }[];
};

export type StartSessionArgsType = {
	sessionId?: string;
	deploymentId: string;
	buildId: string;
	entrypoint: SessionEntrypoint;
	jsonInputs: { key: string; value: string }[];
};
