import { Project, BuildProjectResponse, Error } from "./types";
import { appConfig } from "@api";
import { IApiClient } from "@api/axios";
import { get, pick } from "lodash";
interface IProjectApiClient {
	list(ownerId: string): Promise<Project[] | undefined>;
	buildProject(ownerId: string): Promise<BuildProjectResponse>;
}

export class ProjectApiClient implements IProjectApiClient {
	apiBase: string;
	projectApiClient: IApiClient;

	constructor(projectApiClient: IApiClient) {
		this.apiBase = appConfig.projectApiBase;
		this.projectApiClient = projectApiClient;
	}

	async list(ownerId: string): Promise<Project[] | undefined> {
		try {
			const response = await this.projectApiClient.post(`${this.apiBase}/ListForOwner`, {
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
			const response = await this.projectApiClient.post("/Build", {
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

export default class ProjectService {
	projectApiClient: IProjectApiClient;

	constructor(projectApiClient: IProjectApiClient) {
		this.projectApiClient = projectApiClient;
	}

	async list(ownerId: string): Promise<Project[] | undefined> {
		return this.projectApiClient.list(ownerId);
	}

	async buildProject(projectId: string): Promise<BuildProjectResponse> {
		return this.projectApiClient.buildProject(projectId);
	}
}
