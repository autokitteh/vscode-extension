import { Project, BuildProjectResponse, Error } from "./types";
import { appConfig } from "../../appConfig";
import { IApiClient } from "../../axios/apiClient";
import { get, pick } from "lodash";
export interface IProfileApiClient {
	list(ownerId: string): Promise<Project[] | undefined>;
	buildProject(ownerId: string): Promise<BuildProjectResponse>;
}

export class ProfileApiClient implements IProfileApiClient {
	apiBase: string;
	profileApiClient: IApiClient;

	constructor(profileApiClient: IApiClient) {
		this.apiBase = appConfig.profileApiBase;
		this.profileApiClient = profileApiClient;
	}

	async list(ownerId: string): Promise<Project[] | undefined> {
		try {
			const response = await this.profileApiClient.post(`${this.apiBase}/ListForOwner`, {
				ownerId,
			});
			const projects = get(response, "projects", undefined);
			return projects ? (projects as Project[]) : undefined;
		} catch (exception) {
			console.error(exception);
		}
	}

	async buildProject(projectId: string): Promise<BuildProjectResponse> {
		try {
			const response = await this.profileApiClient.post("/Build", {
				projectId,
			});
			const { buildId, error } = pick(response, ["buildId", "error"]) as {
				buildId: string;
				error: Error;
			};
			return { buildId, error };
		} catch (exception) {
			console.error(exception);
			return {};
		}
	}
}

export default class ProfileService {
	profileApiClient: IProfileApiClient;

	constructor(profileApiClient: IProfileApiClient) {
		this.profileApiClient = profileApiClient;
	}

	async list(ownerId: string): Promise<Project[] | undefined> {
		return this.profileApiClient.list(ownerId);
	}

	async buildProject(projectId: string): Promise<BuildProjectResponse> {
		return this.profileApiClient.buildProject(projectId);
	}
}
