import { User } from "@ak-proto-ts/users/v1/user_pb";
import { usersClient } from "@api/grpc/clients.api";
import { handlegRPCErrors } from "@api/grpc/grpc.errorHandler.api";

export class UsersService {
	static async getByName(name: string): Promise<User | undefined> {
		try {
			return (await usersClient.get({ name })).user;
		} catch (error) {
			handlegRPCErrors(error);
		}
		return undefined;
	}
}
