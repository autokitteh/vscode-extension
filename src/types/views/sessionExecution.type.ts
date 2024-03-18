import { SessionEntrypoint } from "@type/models";

export type SessionExecutionForView = {
	filesWithFunctions: Record<string, SessionEntrypoint[]>;
	firstFileName: string;
	firstFunctionValue: string;
	firstEntrypoint: SessionEntrypoint;
	firstFileFunctions: SessionEntrypoint[];
};
