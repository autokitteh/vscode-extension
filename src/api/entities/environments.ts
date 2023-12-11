import { appConfig } from "@api";
import { IApiClient } from "@api/axios";
import { Environment } from "@type/entities/environments";
import { get } from "lodash";

export class EnvironmentService {
	apiBase: string;
	apiClient: IApiClient;

	constructor(environmentApiClient: IApiClient) {
		this.apiBase = appConfig.environmentApiBase;
		this.apiClient = environmentApiClient;
	}

	async list(projectId: string): Promise<Environment[] | undefined> {
		try {
			const response = await this.apiClient.post(`${this.apiBase}/List`, {
				parentId: projectId,
			});
			const environments = get(response, "envs", []);
			return environments;
		} catch (exception) {
			console.error(exception);
		}
	}
}
