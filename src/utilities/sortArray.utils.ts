import { SortOrder } from "@enums/sortOrder.enum";

export const sortArray = <T>(
	array: T[] | undefined,
	propertyName: keyof T,
	order: SortOrder = SortOrder.ASC
): T[] | undefined => {
	if (!array) {
		return array;
	}
	const sortedArray = [...array];
	sortedArray.sort((a, b) => {
		if (a[propertyName] === undefined) {
			return order === SortOrder.ASC ? 1 : -1;
		}
		if (b[propertyName] === undefined) {
			return order === SortOrder.ASC ? -1 : 1;
		}

		if (typeof a[propertyName] === "string" && typeof b[propertyName] === "string") {
			return order === SortOrder.ASC
				? String(a[propertyName]).localeCompare(String(b[propertyName]))
				: String(b[propertyName]).localeCompare(String(a[propertyName]));
		}

		if (a[propertyName] instanceof Date && b[propertyName] instanceof Date) {
			const dateA = (a[propertyName] as Date).getTime();
			const dateB = (b[propertyName] as Date).getTime();
			return order === SortOrder.ASC ? dateA - dateB : dateB - dateA;
		}

		if (typeof a[propertyName] === "number" && typeof b[propertyName] === "number") {
			return order === SortOrder.ASC
				? Number(a[propertyName]) - Number(b[propertyName])
				: Number(b[propertyName]) - Number(a[propertyName]);
		}

		return 0;
	});

	return sortedArray;
};
