import React from "react";
import { translate } from "@i18n";
import { AKTableHeader, AKTableHeaderCell } from "@react-components/AKTable";

export const AKSessionsTableHeader: React.FC = () => {
	return (
		<AKTableHeader classes="sticky top-12 z-30 flex justify-around">
			<AKTableHeaderCell className="w-64">{translate().t("reactApp.sessions.time")}</AKTableHeaderCell>
			<AKTableHeaderCell className="w-32">{translate().t("reactApp.sessions.status")}</AKTableHeaderCell>
			<AKTableHeaderCell className="w-32">{translate().t("reactApp.sessions.sessionId")}</AKTableHeaderCell>
			<AKTableHeaderCell className="w-16">{translate().t("reactApp.sessions.actions")}</AKTableHeaderCell>
		</AKTableHeader>
	);
};
