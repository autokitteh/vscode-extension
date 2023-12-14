import { Project } from "@ak-proto-ts/projects/v1/project_pb";
import { User } from "@ak-proto-ts/users/v1/user_pb";
import { projectsClient } from "@services/services";
import { get } from "lodash";

export class ProjectService {
	static async listForUser(user: User): Promise<Project[]> {
		const projectsResponse = await projectsClient.listForOwner({
			ownerId: user.userId,
		});
		const projects = get(projectsResponse, "projects", []);
		return projects;
	}
}
