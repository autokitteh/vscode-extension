import { organizationsClient } from "@api/grpc/clients.grpc.api";
import { namespaces } from "@constants";
import { translate } from "@i18n";
import { convertMemberProtoToModel, convertOrganizationProtoToModel } from "@models";
import { LoggerService } from "@services";
import { ServiceResponse } from "@type";
import { Organization, OrganizationMember } from "@type/models";

export class OrganizationsService {
	static async list(userId: string): Promise<ServiceResponse<Organization[]>> {
		try {
			const { orgs, members } = await organizationsClient.getOrgsForUser({ userId, includeOrgs: true });

			const convertedMembers = members.map(convertMemberProtoToModel);

			const convertedOrganizations = Object.values(orgs).map((organization) =>
				convertOrganizationProtoToModel(organization, convertedMembers)
			);

			return { data: convertedOrganizations, error: undefined };
		} catch (error) {
			LoggerService.error(namespaces.organizationsService, (error as Error).message);
			return { data: undefined, error };
		}
	}

	static async getMember(userId: string, organizationId: string): Promise<ServiceResponse<OrganizationMember>> {
		try {
			const { member } = await organizationsClient.getMember({ userId, orgId: organizationId });

			if (!member) {
				LoggerService.error(namespaces.organizationsService, translate().t("organizations.organizationMemberNotFound"));
				return { data: undefined, error: translate().t("organizations.organizationMemberNotFound") };
			}

			return { data: convertMemberProtoToModel(member), error: undefined };
		} catch (error) {
			const log = translate().t("organizations.organizationMemberNotFoundExtended", {
				id: userId,
				error: (error as Error).message,
			});
			LoggerService.error(namespaces.organizationsService, log);
			return { data: undefined, error: log };
		}
	}

	static async get(organizationId: string, userId: string): Promise<ServiceResponse<Organization>> {
		try {
			const { org } = await organizationsClient.get({ orgId: organizationId });

			if (!org) {
				LoggerService.error(namespaces.organizationsService, translate().t("organizations.organizationNotFound"));
				return { data: undefined, error: translate().t("organizations.organizationNotFound") };
			}

			const { data: currentUserOrganizationMember, error } = await this.getMember(userId, organizationId);

			if (error) {
				const log = translate().t("organizations.organizationFetchFailedMemberErrorExtended", {
					userId,
					organizationId,
					error: (error as Error).message,
				});
				LoggerService.error(namespaces.organizationsService, log);
				const message = translate().t("organizations.organizationFetchFailedMemberError");
				return { data: undefined, error: message };
			}

			return { data: convertOrganizationProtoToModel(org, [currentUserOrganizationMember!]), error: undefined };
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
