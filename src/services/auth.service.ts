import { User } from "@ak-proto-ts/users/v1/user_pb";
import { authClient } from "@api/grpc/clients.grpc.api";
import { ServiceResponse } from "@type/services.types";

export class AuthorizationService {
	static async whoAmI(): ServiceResponse<User> {
		try {
			const user = (await authClient.whoAmI({})).user;
			return { data: user, error: undefined };
		} catch (error) {
			return { data: undefined, error };
		}
	}
}
