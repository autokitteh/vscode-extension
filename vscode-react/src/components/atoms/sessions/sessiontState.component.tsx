import React, { ReactNode } from "react";
import { translate } from "@i18n";
import { SessionState as ESessionState } from "@react-enums";

export const SessionState = ({ sessionState }: { sessionState: ESessionState }): ReactNode => {
	switch (sessionState) {
		case ESessionState.CREATED:
			return <div className="text-white">{translate().t("reactApp.sessions.statuses.created")}</div>;
		case ESessionState.RUNNING:
			return <div className="text-blue-500">{translate().t("reactApp.sessions.statuses.running")}</div>;
		case ESessionState.ERROR:
			return <div className="text-red-500">{translate().t("reactApp.sessions.statuses.error")}</div>;
		case ESessionState.COMPLETED:
			return <div className="text-green-500">{translate().t("reactApp.sessions.statuses.completed")}</div>;
		default:
			return <div className="text-blue-500">{translate().t("reactApp.sessions.statuses.unspecified")}</div>;
	}
};
