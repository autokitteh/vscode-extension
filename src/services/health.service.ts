import { projectsClient } from "@api/grpc/clients.grpc.api";
import { Project } from "@type/models";
import { ServiceResponse } from "@type/services.types";

export class HealthService {
	static async testConnection(): Promise<ServiceResponse<Project[]>> {
		try {
			await projectsClient.listForOwner({ ownerId: "" });
			return { data: undefined, error: undefined };
		} catch (error) {
			return { data: undefined, error };
		}
	}
}
