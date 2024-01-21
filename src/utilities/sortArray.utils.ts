import { ArraySorting } from "@enums";

export const sortArrayByType = (
	arr: any[] | undefined,
	propName: string,
	order: ArraySorting.ASC | ArraySorting.DESC = ArraySorting.ASC
): void => {
	arr?.sort((a, b) => {
		const aProp = a[propName];
		const bProp = b[propName];
		let comparison = 0;

		if (typeof aProp === "number" && typeof bProp === "number") {
			comparison = aProp - bProp;
		} else if (typeof aProp === "string" && typeof bProp === "string") {
			comparison = aProp.localeCompare(bProp);
		} else if (aProp instanceof Date && bProp instanceof Date) {
			comparison = aProp.getTime() - bProp.getTime();
		}

		return order === ArraySorting.ASC ? comparison : -comparison;
	});
};
