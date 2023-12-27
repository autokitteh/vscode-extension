import React, { ReactNode } from "react";
import { AKInactive, AKActive } from "@assets/images/projects/deployments";
import { ACTIVE_DEPLOYMENT } from "@constants/projectDeployment.constants";

export const AKDeploymentState = ({ deploymentState }: { deploymentState: string }): ReactNode => {
	return deploymentState === ACTIVE_DEPLOYMENT ? <div>Active</div> : <div>Inactive</div>;
};
