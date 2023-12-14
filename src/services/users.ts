import { User } from "@ak-proto-ts/users/v1/user_pb";
import { usersClient } from "@api/grpc/clients";

export class UsersService {
	static async getByName(name: string): Promise<User | undefined> {
		const user = await usersClient.get({ name });
		return user?.user;
	}
}
