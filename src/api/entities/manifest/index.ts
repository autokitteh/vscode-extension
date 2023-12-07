import { ApplyResponse } from "@type/entities/manifest";
import { appConfig } from "@api";
import { IApiClient } from "@api/axios";
import * as yaml from "js-yaml";

interface IManifestApiClient {
	applyManifest(test: string): Promise<ApplyResponse>;
}

export class ManifestApiClient implements IManifestApiClient {
	apiBase: string;
	apiClient: IApiClient;

	constructor(environmentApiClient: IApiClient) {
		this.apiBase = appConfig.manifestApiBase;
		this.apiClient = environmentApiClient;
	}

	async applyManifest(text: string): Promise<ApplyResponse> {
		try {
			return await this.apiClient.post("", yaml.load(text));
		} catch (exception) {
			console.error(exception);
			return Promise.reject("invalid manifest");
		}
	}
}

export default class ManifestService {
	environmentApiClient: IManifestApiClient;

	constructor(environmentApiClient: IManifestApiClient) {
		this.environmentApiClient = environmentApiClient;
	}

	async applyManifest(text: string): Promise<ApplyResponse> {
		return this.environmentApiClient.applyManifest(text);
	}
}
