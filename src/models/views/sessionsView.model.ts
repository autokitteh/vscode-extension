import { Session } from "@type/models";

export type SessionSectionViewModel = {
	sessions?: Session[];
	selectedDeploymentState: number;
};
