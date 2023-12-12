import { appConfig } from "@api";
import { IApiClient } from "@api/axios";
import { Environment } from "@type/entities/environments";
import { Project } from "@type/entities/project";
import { flattenArray } from "@utilities";
import { get } from "lodash";

export class EnvironmentService {
	apiBase: string;
	apiClient: IApiClient;

	constructor(environmentApiClient: IApiClient) {
		this.apiBase = appConfig.environmentApiBase;
		this.apiClient = environmentApiClient;
	}

	async list(projectId: string): Promise<Environment[]> {
		try {
			const response = await this.apiClient.post(`${this.apiBase}/List`, {
				parentId: projectId,
			});
			return get(response, "envs", []);
		} catch (exception) {
			console.error(exception);
			throw exception;
		}
	}

	async listFromArray(projects: Project[]): Promise<Environment[]> {
		try {
			return flattenArray<Environment>(
				await Promise.all(projects.map((project) => this.list(project.projectId)))
			);
		} catch (exception) {
			console.error(exception);
			throw exception;
		}
	}
}
