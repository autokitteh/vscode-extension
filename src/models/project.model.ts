import { Project as ProtoProject } from "@ak-proto-ts/projects/v1/project_pb";
import { Project } from "@type/models/project.type";

export const convertProjectProtoToTS = (protoProject: ProtoProject): Project => {
	return {
		name: protoProject.name,
		projectId: protoProject.projectId,
	};
};
