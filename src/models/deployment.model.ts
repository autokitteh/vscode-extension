import { Deployment as ProtoDeployment } from "@ak-proto-ts/deployments/v1/deployment_pb";
import { DeploymentType } from "@type/models/deployment.type";
import { convertTimestampToDate } from "@utilities/convertTimestampToDate";
import assign from "lodash/assign";
import pick from "lodash/pick";

export const Deployment = (protoDeployment: ProtoDeployment): DeploymentType => {
	const deployment = pick(protoDeployment, [
		"deploymentId",
		"envId",
		"buildId",
		"createdAt",
		"state",
	]);
	const modifiedDeployment = assign(deployment, {
		createdAt: protoDeployment.createdAt
			? convertTimestampToDate(protoDeployment.createdAt)
			: undefined,
	});

	return { ...modifiedDeployment, sessionsCount: 0, sessions: [] };
};
