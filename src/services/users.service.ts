import { User } from "@ak-proto-ts/users/v1/user_pb";
import { usersClient } from "@api/grpc/clients.grpc.api";
import { ServiceResponse } from "@type/services.types";

export class UsersService {
	static async getByName(name: string): ServiceResponse<User> {
		try {
			const user = (await usersClient.get({ name })).user;
			return { data: user, error: undefined };
		} catch (error) {
			return { data: undefined, error };
		}
	}
}
