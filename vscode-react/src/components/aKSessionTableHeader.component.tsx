import React from "react";
import { translate } from "@i18n";
import { AKTableHeader, AKTableHeaderCell } from "@react-components/AKTable";

export const AKSessionsTableHeader: React.FC = () => {
	return (
		<AKTableHeader classes="sticky top-0">
			<AKTableHeaderCell>{translate().t("reactApp.sessions.time")}</AKTableHeaderCell>
			<AKTableHeaderCell>{translate().t("reactApp.sessions.status")}</AKTableHeaderCell>
			<AKTableHeaderCell>{translate().t("reactApp.sessions.sessionId")}</AKTableHeaderCell>
			<AKTableHeaderCell>{translate().t("reactApp.sessions.actions")}</AKTableHeaderCell>
		</AKTableHeader>
	);
};
