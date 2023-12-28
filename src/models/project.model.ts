import { Project as ProtoProject } from "@ak-proto-ts/projects/v1/project_pb";
import { DeploymentType } from "@type/models/deployment.type";
import { pick } from "@utilities/pick";

export const Project = (protoProject: ProtoProject, deployments: DeploymentType[]) => {
	const project = pick(protoProject, ["name", "projectId"]);
	return { ...project, deployments: deployments };
};
