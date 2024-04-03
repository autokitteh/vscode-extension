import React, { ReactNode } from "react";
import { DeploymentState as EDeploymentState } from "@enums";
import { translate } from "@i18n";

export const DeploymentState = ({ deploymentState }: { deploymentState: EDeploymentState }): ReactNode => {
	switch (deploymentState) {
		case EDeploymentState.ACTIVE_DEPLOYMENT:
			return <div className="text-green-500">{translate().t("reactApp.deployments.statuses.active")}</div>;
		case EDeploymentState.INACTIVE_DEPLOYMENT:
			return <div className="text-gray-400">{translate().t("reactApp.deployments.statuses.inactive")}</div>;
		case EDeploymentState.TESTING_DEPLOYMENT:
			return <div className="text-white">{translate().t("reactApp.deployments.statuses.testing")}</div>;
		case EDeploymentState.DRAINING_DEPLOYMENT:
			return <div className="text-yellow-500">{translate().t("reactApp.deployments.statuses.draining")}</div>;
		default:
			return <div className="text-blue-500">{translate().t("reactApp.deployments.statuses.unspecified")}</div>;
	}
};
