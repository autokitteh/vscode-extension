import { Organization } from "@type/entities/organization";
import { appConfig } from "@api";
import { IApiClient } from "@api/axios";
import { get } from "lodash";

export interface IOrganizationApiClient {
	list(): Promise<string[] | undefined>;
	getOrganizationByName(name: string): Promise<Organization | undefined>;
	getOrganizationByID(id: string): Promise<Organization | undefined>;
}

export class OrganizationApiClient implements IOrganizationApiClient {
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
			return get(response, 'org', {}) as Organization;
		} catch (exception) {
			console.error(exception);
			return undefined;
		}
	}

	async getOrganizationByID(id: string): Promise<Organization | undefined> {
		try {
			const response = await this.organizationApiClient.post(`${this.apiBase}/Get`, {
				orgId: id,
			}) as Organization;
			return response;
		} catch (exception) {
			console.error(exception);
			return undefined;
		}
	}
}

export default class OrganizationService {
	organizationApiClient: IOrganizationApiClient;

	constructor(organizationApiClient: IOrganizationApiClient) {
		this.organizationApiClient = organizationApiClient;
	}

	async list(): Promise<string[] | undefined> {
		return this.organizationApiClient.list();
	}

	async getOrganizationByName(name: string): Promise<Organization | undefined> {
		return this.organizationApiClient.getOrganizationByName(name);
	}

	async getOrganizationByID(id: string): Promise<Organization | undefined> {
		return this.organizationApiClient.getOrganizationByID(id);
	}
}
