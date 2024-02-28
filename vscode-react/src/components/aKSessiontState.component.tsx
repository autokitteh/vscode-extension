import React, { ReactNode } from "react";
import { translate } from "@i18n";
import { SessionState } from "@react-enums";

export const AKSessionState = ({ sessionState }: { sessionState: SessionState }): ReactNode => {
	switch (sessionState) {
		case SessionState.CREATED:
			return <div className="text-white">{translate().t("reactApp.sessions.statuses.created")}</div>;
		case SessionState.RUNNING:
			return <div className="text-blue-500">{translate().t("reactApp.sessions.statuses.running")}</div>;
		case SessionState.ERROR:
			return <div className="text-red-500">{translate().t("reactApp.sessions.statuses.error")}</div>;
		case SessionState.COMPLETED:
			return <div className="text-green-500">{translate().t("reactApp.sessions.statuses.completed")}</div>;
		default:
			return <div className="text-blue-500">{translate().t("reactApp.sessions.statuses.unspecified")}</div>;
	}
};
