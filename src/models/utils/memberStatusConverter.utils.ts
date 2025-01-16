import { OrgMemberStatus as ProtoOrgMemberStatus } from "@ak-proto-ts/orgs/v1/org_pb";
import { MemberStatus } from "@enums";
import { MemberStatusKeyType } from "@interfaces";

export const memberStatusConverter = (protoMemberStatus?: ProtoOrgMemberStatus): MemberStatus => {
	if (!protoMemberStatus) {
		return MemberStatus.unspecified;
	}
	const memberStatus = ProtoOrgMemberStatus[protoMemberStatus].toLowerCase();

	return MemberStatus[memberStatus as MemberStatusKeyType];
};
