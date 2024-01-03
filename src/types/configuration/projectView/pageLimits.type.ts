import { PaginationListEntity } from "@enums";
import { PageSize } from "@type/interfaces";

export type PageLimits = {
	[key in PaginationListEntity]: PageSize;
};

export type CountEntitites = {
	[key in PaginationListEntity]: number;
};
