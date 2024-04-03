import React from "react";
import { translate } from "@i18n";
import { TableHeader, TableHeaderCell } from "@react-components/atoms/table";

export const DeploymentTableHeader: React.FC = () => {
	return (
		<TableHeader classes="sticky top-0">
			<TableHeaderCell>{translate().t("reactApp.deployments.time")}</TableHeaderCell>
			<TableHeaderCell>{translate().t("reactApp.deployments.status")}</TableHeaderCell>
			<TableHeaderCell>{translate().t("reactApp.sessions.statuses.running")}</TableHeaderCell>
			<TableHeaderCell>{translate().t("reactApp.sessions.statuses.error")}</TableHeaderCell>
			<TableHeaderCell>{translate().t("reactApp.sessions.statuses.completed")}</TableHeaderCell>
			<TableHeaderCell>{translate().t("reactApp.deployments.buildId")}</TableHeaderCell>
			<TableHeaderCell>{translate().t("reactApp.deployments.actions")}</TableHeaderCell>
		</TableHeader>
	);
};
