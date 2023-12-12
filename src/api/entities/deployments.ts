import { appConfig } from "@api";
import { IApiClient } from "@api/axios";
import { Deployment } from "@type/entities/deployment";
import { Environment } from "@type/entities/environments";
import { flattenArray } from "@utilities/index";
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

	async listFromArray(environments: Environment[]): Promise<Deployment[] | undefined> {
		try {
			return flattenArray<Deployment>(
				await Promise.all(environments.map((environment) => this.list(environment.envId)))
			);
		} catch (exception) {
			console.error(exception);
			throw exception;
		}
		// try {
		// 	const response = await this.apiClient.post(`${this.apiBase}/List`, {
		// 		envId: environmentId,
		// 	});
		// 	const deployments = get(response, "deployments", []);
		// 	return deployments;
		// } catch (exception) {
		// 	console.error(exception);
		// }
	}
}
