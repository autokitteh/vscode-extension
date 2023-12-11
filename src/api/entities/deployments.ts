import { appConfig } from "@api";
import { IApiClient } from "@api/axios";
import { Deployment } from "@type/entities/deployment";
import { get } from "lodash";

export class DeploymentService {
	apiBase: string;
	apiClient: IApiClient;

	constructor(deploymentApiClient: IApiClient) {
		this.apiBase = appConfig.deploymentApiBase;
		this.apiClient = deploymentApiClient;
	}

	async list(environmentId: string): Promise<Deployment[] | undefined> {
		try {
			const response = await this.apiClient.post(`${this.apiBase}/List`, {
				envId: environmentId,
			});
			const deployments = get(response, "deployments", []);
			return deployments;
		} catch (exception) {
			console.error(exception);
		}
	}
}
