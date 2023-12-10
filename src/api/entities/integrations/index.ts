import { Integration } from "@type/entities/integration";
import { appConfig } from "@api";
import { IApiClient } from "@api/axios";
import { get } from "lodash";

export interface IIntegrationApiClient {
	list(organizationId: string): Promise<Integration[] | undefined>;
}

export class IntegrationApiClient implements IIntegrationApiClient {
	apiBase: string;
	integrationApiClient: IApiClient;

	constructor(integrationApiClient: IApiClient) {
		this.apiBase = appConfig.integrationApiBase;
		this.integrationApiClient = integrationApiClient;
	}

	async list(organizationId: string): Promise<Integration[] | undefined> {
		try {
			const response = await this.integrationApiClient.post(`${this.apiBase}/List`,
				{ ownerId: organizationId }
			);

			return get(response, 'integrations', []) as Integration[];
		} catch (exception) {
			console.error(exception);
			return undefined;
		}
	}
}

export default class IntegrationService {
	integrationApiClient: IIntegrationApiClient;

	constructor(integrationApiClient: IIntegrationApiClient) {
		this.integrationApiClient = integrationApiClient;
	}

	async list(organizationId: string): Promise<Integration[] | undefined> {
		return this.integrationApiClient.list(organizationId);
	}
}
