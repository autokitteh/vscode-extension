import { appConfig } from "@api";
import { IApiClient } from "@api/axios";
import { User } from "@type/entities/user";
import { get } from "lodash";

export class UserService {
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
			return get(response, "user", {}) as User;
		} catch (exception) {
			console.error(exception);
			return undefined;
		}
	}
}
