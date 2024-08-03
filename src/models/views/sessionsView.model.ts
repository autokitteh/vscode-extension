import { SessionLogRecord } from "@models/sessionLogRecord.model";
import { Deployment, Session } from "@type/models";

export type SessionSectionViewModel = {
	sessions?: Session[];
	showLiveTail: boolean;
	lastDeployment?: Deployment;
	isLiveStateOn?: boolean;
};

export type SessionLogsSectionViewModel = {
	logs?: SessionLogRecord[];
};
