import { Project } from "@ak-proto-ts/projects/v1/project_pb";
import { projectsClient } from "@api/grpc/clients";

export class ProjectController {
	static async listForUser(userId: string): Promise<Project[]> {
		const projectsResponse = await projectsClient.listForOwner({
			ownerId: userId,
		});
		return projectsResponse?.projects || [];
	}

	static async listForTree(userId: string): Promise<string[]> {
		return (await this.listForUser(userId)).map((project) => project.name);
	}
}
