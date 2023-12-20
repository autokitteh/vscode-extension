import { User } from "@ak-proto-ts/users/v1/user_pb";
import { authClient } from "@api/grpc/clients";
import { UsersService } from "@services/users.service";

const DEBUG_USER_NAME = "george";

export class AuthorizationService {
	static async whoAmI(): Promise<User | undefined> {
		const isDebug = process.env.DEBUG_MODE === "true";
		if (isDebug) {
			return await UsersService.getByName(DEBUG_USER_NAME);
		}
		return (await authClient.whoAmI({}))?.user;
	}
}
