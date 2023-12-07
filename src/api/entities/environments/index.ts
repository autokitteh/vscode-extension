import { Environment } from "@type/entities/environments";
import { appConfig } from "@api/index";
import { IApiClient } from "@api/axios";
import { get } from "lodash";

interface IEnvironmentApiClient {
	listEnvironments(ownerId: string): Promise<Environment[] | undefined>;
}

export class EnvironmentsApiClient implements IEnvironmentApiClient {
	apiBase: string;
	apiClient: IApiClient;

	constructor(environmentApiClient: IApiClient) {
		this.apiBase = appConfig.environmentApiBase;
		this.apiClient = environmentApiClient;
	}

	async listEnvironments(parentId: string): Promise<Environment[] | undefined> {
		try {
			const response = await this.apiClient.post("/List", {
				parentId,
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

	async getProjects(ownerId: string): Promise<Environment[] | undefined> {
		return this.environmentApiClient.listEnvironments(ownerId);
	}
}
