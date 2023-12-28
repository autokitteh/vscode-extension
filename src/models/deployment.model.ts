import { Deployment as ProtoDeployment } from "@ak-proto-ts/deployments/v1/deployment_pb";
import { Session as ProtoSession } from "@ak-proto-ts/sessions/v1/session_pb";
import { Session } from "@models/session.model";
import { pick } from "@utilities/pick";

export const Deployment = (protoDeployment: ProtoDeployment, sessions: ProtoSession[]) => {
	const deployment = pick(protoDeployment, ["deploymentId", "envId", "buildId", "createdAt"]);
	const deploymentSessions = sessions.map((session) => Session(session));
	return { ...deployment, sessions: deploymentSessions, sessionsCount: deploymentSessions.length };
};
