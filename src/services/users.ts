import { User } from "@ak-proto-ts/users/v1/user_pb";
import { usersClient } from "@services/services";
import { get } from "lodash";

export class UserService {
	static async getUserByName(name: string): Promise<User> {
		const users = await usersClient.get({ name });
		const user = get(users, "user", {}) as User;
		return user;
	}
}
