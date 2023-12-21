import { Project } from "@ak-proto-ts/projects/v1/project_pb";
import { projectsClient } from "@api/grpc/clients";
import { handlegRPCErrors } from "@api/grpc/grpc.errorHandler";

export class ProjectsService {
	static async listForUser(userId: string): Promise<Project[]> {
		try {
			const projectsResponse = await projectsClient.listForOwner({
				ownerId: userId,
			});
			return projectsResponse.projects;
		} catch (error) {
			handlegRPCErrors(error);
		}
		return [];
	}

	static async listForTree(userId: string): Promise<SidebarTreeItem[]> {
		try {
			return (await this.listForUser(userId)).map((project) => ({
				label: project.name,
				key: project.projectId,
			}));
		} catch (error) {
			handlegRPCErrors(error);
		}
		return [];
	}

	static async get(projectId: string): Promise<Project | undefined> {
		try {
			const response = await projectsClient.get({ projectId });
			return response?.project || undefined;
		} catch (error) {
			handlegRPCErrors(error);
		}
		return undefined;
	}

	static async list(userId: string): Promise<Project[]> {
		try {
			const response = await projectsClient.listForOwner({ ownerId: userId });
			return response.projects;
		} catch (error) {
			handlegRPCErrors(error);
		}
		return [];
	}
}
