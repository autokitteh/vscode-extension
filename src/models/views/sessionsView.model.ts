import { Deployment, Session } from "@type/models";

export type SessionSectionViewModel = {
	sessions?: Session[];
	lastDeployment?: Deployment;
};
