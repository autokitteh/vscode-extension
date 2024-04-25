import React from "react";
import { translate } from "@i18n";
import { AKTableHeader, AKTableHeaderCell } from "@react-components/AKTable";

export const AKDeploymentTableHeader: React.FC = () => {
	return (
		<AKTableHeader classes="sticky top-12 z-30">
			<AKTableHeaderCell>{translate().t("reactApp.deployments.time")}</AKTableHeaderCell>
			<AKTableHeaderCell>{translate().t("reactApp.deployments.status")}</AKTableHeaderCell>
			<AKTableHeaderCell>{translate().t("reactApp.sessions.statuses.stopped")}</AKTableHeaderCell>
			<AKTableHeaderCell>{translate().t("reactApp.sessions.statuses.running")}</AKTableHeaderCell>
			<AKTableHeaderCell>{translate().t("reactApp.sessions.statuses.error")}</AKTableHeaderCell>
			<AKTableHeaderCell>{translate().t("reactApp.sessions.statuses.completed")}</AKTableHeaderCell>
			<AKTableHeaderCell>{translate().t("reactApp.deployments.buildId")}</AKTableHeaderCell>
			<AKTableHeaderCell>{translate().t("reactApp.deployments.actions")}</AKTableHeaderCell>
		</AKTableHeader>
	);
};
