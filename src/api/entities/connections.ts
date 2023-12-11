import { appConfig } from "@api";
import { IApiClient } from "@api/axios";
import { Connection, Value } from "@type/entities/connections";
import { get } from "lodash";

export class ConnectionService {
	apiBase: string;
	connectionApiClient: IApiClient;

	constructor(connectionApiClient: IApiClient) {
		this.apiBase = appConfig.connectionApiBase;
		this.connectionApiClient = connectionApiClient;
	}

	async list(parentId: string): Promise<Connection[] | undefined> {
		try {
			const response = await this.connectionApiClient.post(`${this.apiBase}/ListForOwner`, {
				parentId,
			});
			return get(response, "connections", undefined);
		} catch (exception) {
			console.error(exception);
			return undefined;
		}
	}

	async getConnection(connectionId: string): Promise<Connection | undefined> {
		try {
			const response = await this.connectionApiClient.post(`${this.apiBase}/Get`, {
				connectionId,
			});
			return get(response, "connection", undefined);
		} catch (exception) {
			console.error(exception);
			return undefined;
		}
	}

	async useConnection(connectionId: string): Promise<{ values: { [k: string]: Value } }> {
		try {
			return this.connectionApiClient.post(`${this.apiBase}/Get`, {
				connectionId,
			}) as Promise<{ values: { [k: string]: Value } }>;
		} catch (error) {
			return { values: {} };
		}
	}
}
