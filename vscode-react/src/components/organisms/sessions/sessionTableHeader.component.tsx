import React from "react";
import { translate } from "@i18n";
import { TableHeader, TableHeaderCell } from "@react-components/atoms/table";

export const SessionsTableHeader: React.FC = () => {
	return (
		<TableHeader classes="sticky top-0">
			<TableHeaderCell>{translate().t("reactApp.sessions.time")}</TableHeaderCell>
			<TableHeaderCell>{translate().t("reactApp.sessions.status")}</TableHeaderCell>
			<TableHeaderCell>{translate().t("reactApp.sessions.sessionId")}</TableHeaderCell>
			<TableHeaderCell>{translate().t("reactApp.sessions.actions")}</TableHeaderCell>
		</TableHeader>
	);
};
