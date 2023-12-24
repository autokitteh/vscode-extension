import { authClient } from "@api/grpc/clients.grpc.api";
import { ServiceResponse } from "@type/services.types";

export class AuthorizationService {
	static async whoAmI(): ServiceResponse {
		try {
			const user = (await authClient.whoAmI({})).user;
			return { data: user, error: undefined };
		} catch (error) {
			return { data: undefined, error };
		}
	}
}
