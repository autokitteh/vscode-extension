import { PaginationListEntity } from "@enums";

export const pageLimits = {
	[PaginationListEntity.SESSIONS]: 5,
	[PaginationListEntity.DEPLOYMENTS]: 5,
};
