import { usersClient } from "@api/grpc/clients.grpc.api";
import { ServiceResponse } from "@type/services.types";

export class UsersService {
	static async getByName(name: string): ServiceResponse {
		try {
			const user = (await usersClient.get({ name })).user;
			return { data: user, error: undefined };
		} catch (error) {
			return { data: undefined, error };
		}
	}
}
