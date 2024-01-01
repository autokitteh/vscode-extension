import React, { ReactNode } from "react";
import { AKInactive, AKActive } from "@react-assets/images/projects/deployments";
import { ACTIVE_DEPLOYMENT } from "@react-constants/projectDeployment.constants";

export const AKDeploymentState = ({ deploymentState }: { deploymentState: string }): ReactNode => {
	return deploymentState === ACTIVE_DEPLOYMENT ? <AKActive /> : <AKInactive />;
};
