import React, { ReactNode } from "react";
import { AKInactive, AKActive } from "@assets/images/projects/deployments";
import { ACTIVE_DEPLOYMENT } from "@constants/projectDeployment.constants";

export const AKDeploymentState = ({ deploymentState }: { deploymentState: string }): ReactNode => {
	// TODO: Add states, the full list is: Active, Inactive, Testing, Draining, Inactive, Unspecified
	// The dictionary of this enum described here: repo/src/types/models/deployments.enriched.type.ts
	return deploymentState === ACTIVE_DEPLOYMENT ? <AKActive /> : <AKInactive />;
};
