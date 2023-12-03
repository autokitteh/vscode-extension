import { Environment } from "./types";
import { AxiosResponse } from "../../axios/types";
import { appConfig } from "../../appConfig";
import { IApiClient } from "../../axios/apiClient";
import { get } from "lodash";
export interface IEnvironmentApiClient {
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
