import { organizationsClient } from "@api/grpc/clients.grpc.api";
import { namespaces } from "@constants";
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
}
