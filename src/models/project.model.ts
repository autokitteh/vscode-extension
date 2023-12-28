import { Deployment as ProtoDeployment } from "@ak-proto-ts/deployments/v1/deployment_pb";
import { Project as ProtoProject } from "@ak-proto-ts/projects/v1/project_pb";
import { Session as ProtoSession } from "@ak-proto-ts/sessions/v1/session_pb";
import { Session } from "@models/session.model";
import { pick } from "@utilities/pick";

export const Deployment = (
	protoProject: ProtoProject,
	protoDeployments: ProtoDeployment[],
	protoSessions: ProtoSession
) => {
	const project = pick(protoProject, ["name", "projectId"]);
	return { ...project };
	// const deploymentSessions = sessions.map((session) => Session(session));
	// return { ...deployment, deployments: protoDeployments };
};
