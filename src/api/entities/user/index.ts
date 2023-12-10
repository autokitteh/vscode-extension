import { User } from "@type/entities/user";
import { appConfig } from "@api";
import { IApiClient } from "@api/axios";
import { get } from "lodash";

export interface IUserApiClient {
	getUserByName(name: string): Promise<User | undefined>;
	getUserByID(id: string): Promise<User | undefined>;
}

export class UserApiClient implements IUserApiClient {
	apiBase: string;
	userApiClient: IApiClient;

	constructor(userApiClient: IApiClient) {
		this.apiBase = appConfig.userApiBase;
		this.userApiClient = userApiClient;
	}

	async getUserByName(name: string): Promise<User | undefined> {
		try {
			const response = await this.userApiClient.post(`${this.apiBase}/Get`, {
				name,
			});
			return get(response, 'user', {}) as User;
		} catch (exception) {
			console.error(exception);
			return undefined;
		}
	}

	async getUserByID(id: string): Promise<User | undefined> {
		try {
			const response = await this.userApiClient.post(`${this.apiBase}/Get`, {
				orgId: id,
			}) as User;
			return response;
		} catch (exception) {
			console.error(exception);
			return undefined;
		}
	}
}

export default class UserService {
	userApiClient: IUserApiClient;

	constructor(userApiClient: IUserApiClient) {
		this.userApiClient = userApiClient;
	}

	async getUserByName(name: string): Promise<User | undefined> {
		return this.userApiClient.getUserByName(name);
	}

	async getUserByID(id: string): Promise<User | undefined> {
		return this.userApiClient.getUserByID(id);
	}
}
