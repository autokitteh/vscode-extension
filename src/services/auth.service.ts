import i18n from "i18next";

import { authClient } from "@api/grpc/clients.grpc.api";
import { namespaces } from "@constants";
import { convertUserProtoToModel } from "@models";
import { LoggerService } from "@services";
import { ServiceResponse } from "@type";
import { User } from "@type/models";

export class AuthService {
	static async whoAmI(): Promise<ServiceResponse<User>> {
		try {
			const { user } = await authClient.whoAmI({});
			if (!user) {
				return {
					data: undefined,
					error: i18n.t("userNotFound", {
						ns: "organizations",
					}),
				};
			}
			const convertedUser = convertUserProtoToModel(user);

			return { data: convertedUser, error: undefined };
		} catch (error) {
			const errorMessage = i18n.t("userFetchErrorExtended", {
				ns: "errors",
				error: new Error(error as string).message,
			});
			LoggerService.error(namespaces.authService, errorMessage);

			return { data: undefined, error };
		}
	}
}
