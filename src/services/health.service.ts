import { User } from "@ak-proto-ts/users/v1/user_pb";
import { projectsClient } from "@api/grpc/clients.grpc.api";
import { ServiceResponse } from "@type/services.types";

export class HealthService {
	static async testConnection(): Promise<ServiceResponse<User>> {
		try {
			await projectsClient.listForOwner({ ownerId: "" });
			return { data: undefined, error: undefined };
		} catch (error) {
			return { data: undefined, error };
		}
	}
}
