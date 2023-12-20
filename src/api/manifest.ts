import { appConfig } from "@api";
import { IApiClient } from "@api/axios";
import { ApplyResponse } from "@type/entities/manifest.type";
import * as yaml from "js-yaml";

export class ManifestService {
	apiBase: string;
	apiClient: IApiClient;

	constructor(manifestApiClient: IApiClient) {
		this.apiBase = appConfig.manifestApiBase;
		this.apiClient = manifestApiClient;
	}

	async applyManifest(text: string): Promise<ApplyResponse> {
		try {
			return await this.apiClient.post(`${this.apiBase}/x/apply`, yaml.load(text));
		} catch (exception) {
			console.error(exception);
			return Promise.reject("invalid manifest");
		}
	}
}
