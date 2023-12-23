import { User } from "@ak-proto-ts/users/v1/user_pb";
import { authClient } from "@api/grpc/clients.grpc.api";
import { handlegRPCErrors } from "@api/grpc/errorHandler.grpc.api";

export class AuthorizationService {
	static async whoAmI(): Promise<User | undefined> {
		try {
			return (await authClient.whoAmI({})).user;
		} catch (error) {
			handlegRPCErrors(error);
		}
	}
}
