import React from "react";
import { translate } from "@i18n";
import { HeaderCell } from "@react-components/atoms/table";
import { TableHeader } from "@react-components/molecules/table";

export const DeploymentTableHeader: React.FC = () => {
	return (
		<TableHeader classes="sticky top-12 z-30">
			<HeaderCell>{translate().t("reactApp.deployments.time")}</HeaderCell>
			<HeaderCell>{translate().t("reactApp.deployments.status")}</HeaderCell>
			<HeaderCell>{translate().t("reactApp.sessions.statuses.stopped")}</HeaderCell>
			<HeaderCell>{translate().t("reactApp.sessions.statuses.running")}</HeaderCell>
			<HeaderCell>{translate().t("reactApp.sessions.statuses.error")}</HeaderCell>
			<HeaderCell>{translate().t("reactApp.sessions.statuses.completed")}</HeaderCell>
			<HeaderCell>{translate().t("reactApp.deployments.buildId")}</HeaderCell>
			<HeaderCell>{translate().t("reactApp.deployments.actions")}</HeaderCell>
		</TableHeader>
	);
};
