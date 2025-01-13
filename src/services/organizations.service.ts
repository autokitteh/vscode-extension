import { organizationsClient } from "@api/grpc/clients.grpc.api";
import { namespaces } from "@constants";
import { translate } from "@i18n";
import { convertOrganizationProtoToModel } from "@models";
import { LoggerService } from "@services";
import { ServiceResponse } from "@type";
import { Organization } from "@type/models";

export class OrganizationsService {
	static async list(userId: string): Promise<ServiceResponse<Organization[]>> {
		try {
			const { orgs } = await organizationsClient.getOrgsForUser({ userId, includeOrgs: true });

			const convertedOrganizations = Object.values(orgs).map(convertOrganizationProtoToModel);

			return { data: convertedOrganizations, error: undefined };
		} catch (error) {
			LoggerService.error(namespaces.organizationsService, (error as Error).message);
			return { data: undefined, error };
		}
	}
	static async get(organizationId: string): Promise<ServiceResponse<Organization>> {
		try {
			const { org } = await organizationsClient.get({ orgId: organizationId });

			if (!org) {
				LoggerService.error(namespaces.organizationsService, translate().t("organizations.organizationNotFound"));
				return { data: undefined, error: translate().t("organizations.organizationNotFound") };
			}

			return { data: convertOrganizationProtoToModel(org), error: undefined };
		} catch (error) {
			const log = translate().t("organizations.organizationNotFoundExtended", {
				id: organizationId,
				error: (error as Error).message,
			});
			LoggerService.error(namespaces.organizationsService, log);
			return { data: undefined, error: log };
		}
	}
}
