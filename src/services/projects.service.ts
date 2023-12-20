import { Project } from "@ak-proto-ts/projects/v1/project_pb";
import { projectsClient } from "@api/grpc/clients";

export class ProjectsService {
	static async listForUser(userId: string): Promise<Project[]> {
		const projectsResponse = await projectsClient.listForOwner({
			ownerId: userId,
		});
		return projectsResponse?.projects || [];
	}

	static async listForTree(userId: string): Promise<SidebarTreeItem[]> {
		return (await this.listForUser(userId)).map((project) => ({
			label: project.name,
			key: project.projectId,
		}));
	}

	static async get(projectId: string): Promise<Project | undefined> {
		const response = await projectsClient.get({ projectId });
		return response?.project || undefined;
	}

	static async list(userId: string): Promise<Project[]> {
		const response = await projectsClient.listForOwner({ ownerId: userId });
		return response.projects;
	}
}
