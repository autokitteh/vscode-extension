import { Deployment, Session } from "@type/models";

export type SessionSectionViewModel = {
	sessions?: Session[];
	showLiveTail: boolean;
	lastDeployment?: Deployment;
};
