import { ProjectViewSections } from "@enums";
import { SectionRowsRange } from "@type/interfaces";

export type PageLimits = {
	[key in ProjectViewSections]: SectionRowsRange;
};

export type TotalEntityCount = {
	[key in ProjectViewSections]: number;
};
