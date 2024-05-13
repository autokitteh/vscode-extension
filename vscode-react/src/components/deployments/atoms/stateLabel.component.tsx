import React, { ReactNode } from "react";
import { DeploymentState } from "@enums";
import { translate } from "@i18n";

export const DeploymentStateLabel = ({ deploymentState }: { deploymentState: DeploymentState }): ReactNode => {
	switch (deploymentState) {
		case DeploymentState.ACTIVE_DEPLOYMENT:
			return <div className="text-green-500">{translate().t("reactApp.deployments.statuses.active")}</div>;
		case DeploymentState.INACTIVE_DEPLOYMENT:
			return <div className="text-gray-400">{translate().t("reactApp.deployments.statuses.inactive")}</div>;
		case DeploymentState.TESTING_DEPLOYMENT:
			return <div className="text-white">{translate().t("reactApp.deployments.statuses.testing")}</div>;
		case DeploymentState.DRAINING_DEPLOYMENT:
			return <div className="text-yellow-500">{translate().t("reactApp.deployments.statuses.draining")}</div>;
		default:
			return <div className="text-blue-500">{translate().t("reactApp.deployments.statuses.unspecified")}</div>;
	}
};
