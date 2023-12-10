import { Environment } from "@type/entities/environments";
import { appConfig } from "@api";
import { IApiClient } from "@api/axios";
import { get } from "lodash";

interface IEnvironmentApiClient {
	list(projectId: string): Promise<Environment[] | undefined>;
}

export class EnvironmentsApiClient implements IEnvironmentApiClient {
	apiBase: string;
	apiClient: IApiClient;

	constructor(environmentApiClient: IApiClient) {
		this.apiBase = appConfig.environmentApiBase;
		this.apiClient = environmentApiClient;
	}

	async list(projectId: string): Promise<Environment[] | undefined> {
		try {
			const response = await this.apiClient.post("/List", {
				parentId: projectId,
			});
			const environments = get(response, "envs", []);
			return environments;
		} catch (exception) {
			console.error(exception);
		}
	}
}

export default class EnvironmentService {
	environmentApiClient: IEnvironmentApiClient;

	constructor(environmentApiClient: IEnvironmentApiClient) {
		this.environmentApiClient = environmentApiClient;
	}

	async list(projectId: string): Promise<Environment[] | undefined> {
		return this.environmentApiClient.list(projectId);
	}
}
