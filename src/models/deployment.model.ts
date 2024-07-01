import { Deployment as ProtoDeployment } from "@ak-proto-ts/deployments/v1/deployment_pb";
import { sessionStateStatsConverter } from "@models/utils/sessionsStateConverter.utils";
import { Deployment } from "@type/models";
import { convertTimestampToDate } from "@utilities";

/**
 * Converts a ProtoDeployment object to a TypeScript Deployment object.
 *
 * @param {ProtoDeployment} protoDeployment - The ProtoDeployment object to convert.
 * @returns {Deployment} The converted TypeScript Deployment object.
 */
export const convertDeploymentProtoToModel = (protoDeployment: ProtoDeployment): Deployment => ({
	deploymentId: protoDeployment.deploymentId,
	envId: protoDeployment.envId,
	buildId: protoDeployment.buildId,
	createdAt: convertTimestampToDate(protoDeployment.createdAt!),
	state: protoDeployment.state,
	sessionStats: sessionStateStatsConverter(protoDeployment.sessionsStats),
});
