import { appConfig } from "@api";
import { IApiClient } from "@api/axios";
import { Organization } from "@type/entities/organization";
import { get } from "lodash";

export class OrganizationService {
	apiBase: string;
	organizationApiClient: IApiClient;

	constructor(organizationApiClient: IApiClient) {
		this.apiBase = appConfig.organizationApiBase;
		this.organizationApiClient = organizationApiClient;
	}

	async list(): Promise<string[] | undefined> {
		try {
			// const response = await this.organizationApiClient.post(`${this.apiBase}/ListForOwner`, {
			// 	parentId,
			// });

			return ["autokitteh"];
		} catch (exception) {
			console.error(exception);
			return undefined;
		}
	}

	async getOrganizationByName(name: string): Promise<Organization | undefined> {
		try {
			const response = await this.organizationApiClient.post(`${this.apiBase}/Get`, {
				name,
			});
			return get(response, "org", {}) as Organization;
		} catch (exception) {
			console.error(exception);
			return undefined;
		}
	}

	async getOrganizationByID(id: string): Promise<Organization | undefined> {
		try {
			const response = (await this.organizationApiClient.post(`${this.apiBase}/Get`, {
				orgId: id,
			})) as Organization;
			return response;
		} catch (exception) {
			console.error(exception);
			return undefined;
		}
	}
}
