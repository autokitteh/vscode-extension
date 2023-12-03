import { Connection, Value } from "./types";
import { appConfig } from "../../appConfig";
import { IApiClient } from "../../axios/apiClient";
import { get } from "lodash";
export interface IConnectionpiClient {
	list(parentId: string): Promise<Connection[] | undefined>;
	getConnection(connectionId: string): Promise<Connection | undefined>;
	useConnection(connectionId: string): Promise<{ values: { [k: string]: Value } }>;
}

export class ConnectionpiClient implements IConnectionpiClient {
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

export default class ConnectionService {
	connectionApiClient: IConnectionpiClient;

	constructor(connectionApiClient: IConnectionpiClient) {
		this.connectionApiClient = connectionApiClient;
	}

	async list(parentId: string): Promise<Connection[] | undefined> {
		return this.connectionApiClient.list(parentId);
	}

	async getConnection(connectionId: string): Promise<Connection | undefined> {
		return this.connectionApiClient.getConnection(connectionId);
	}
}
