import { User } from "@ak-proto-ts/users/v1/user_pb";
import { authClient } from "@services/services";
import { UserService } from "@services/users";

export class AuthService {
	static async whoAmI(): Promise<User> {
		const isDebug = process.env.DEBUG_MODE === "true";
		if (isDebug) {
			return await UserService.getUserByName("george");
		}
		return (await authClient.whoAmI({})) as User;
	}
}
