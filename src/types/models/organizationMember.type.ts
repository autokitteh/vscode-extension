import { MemberRole, MemberStatus } from "@enums";

export type OrganizationMember = {
	organizationId: string;
	role: MemberRole;
	status: MemberStatus;
};

export type OrganizationMemberStatus = {
	id: string;
	organizationId: string;
	userId: string;
};
