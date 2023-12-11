import { appConfig } from "@api";
import { IApiClient } from "@api/axios";
import { BuildProjectResponse, Error, Project } from "@type/entities/project";
import { get, pick } from "lodash";

export class ProjectService {
	apiBase: string;
	projectApiClient: IApiClient;

	constructor(projectApiClient: IApiClient) {
		this.apiBase = appConfig.projectApiBase;
		this.projectApiClient = projectApiClient;
	}

	async list(userId: string): Promise<Project[] | undefined> {
		try {
			const response = await this.projectApiClient.post(`${this.apiBase}/ListForOwner`, {
				ownerId: userId,
			});
			const projects = get(response, "projects", undefined);
			return projects ? (projects as Project[]) : undefined;
		} catch (exception) {
			console.error(exception);
		}
	}

	async buildProject(projectId: string): Promise<BuildProjectResponse> {
		try {
			const response = await this.projectApiClient.post("/Build", {
				projectId,
			});
			const { buildId, error } = pick(response, ["buildId", "error"]) as {
				buildId: string;
				error: Error;
			};
			return { buildId, error };
		} catch (exception) {
			console.error(exception);
			return {};
		}
	}
}
