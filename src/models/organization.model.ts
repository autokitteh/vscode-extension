import { Org as ProtoOrganization, OrgMember as ProtoOrganizationMember } from "@ak-proto-ts/orgs/v1/org_pb";
import { MemberRole, MemberStatus } from "@enums";
import { memberStatusConverter } from "@models/utils/memberStatusConverter.utils";
import { Organization, OrganizationMember } from "@type/models";

export const convertOrganizationProtoToModel = (
	protoOrganization: ProtoOrganization,
	members: OrganizationMember[]
): Organization => {
	const memberInOrganization = members.find((member) => member.organizationId === protoOrganization.orgId);
	return {
		name: protoOrganization.displayName,
		organizationId: protoOrganization.orgId,
		isActive: memberInOrganization?.status === MemberStatus.active,
	};
};

export const convertMemberProtoToModel = (protoOrganizationMember: ProtoOrganizationMember): OrganizationMember => {
	let role: MemberRole;
	if (protoOrganizationMember.roles.includes("admin")) {
		role = MemberRole.admin;
	} else if (protoOrganizationMember.roles.length === 0) {
		role = MemberRole.user;
	} else {
		role = MemberRole.unspecified;
	}

	return {
		organizationId: protoOrganizationMember.orgId,
		status: memberStatusConverter(protoOrganizationMember.status),
		role,
	};
};
