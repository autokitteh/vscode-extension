import { SortOrder } from "@type/utilities/sortArray.type";

export const sortArray = <T>(
	array: T[] | undefined,
	propertyName: keyof T,
	order: SortOrder = "asc"
): T[] | undefined => {
	if (!array) {
		return array;
	}
	const sortedArray = [...array];
	sortedArray.sort((a, b) => {
		if (a[propertyName] === undefined) {
			return order === "asc" ? 1 : -1;
		}
		if (b[propertyName] === undefined) {
			return order === "asc" ? -1 : 1;
		}

		if (typeof a[propertyName] === "string" && typeof b[propertyName] === "string") {
			return order === "asc"
				? String(a[propertyName]).localeCompare(String(b[propertyName]))
				: String(b[propertyName]).localeCompare(String(a[propertyName]));
		}

		if (a[propertyName] instanceof Date && b[propertyName] instanceof Date) {
			const dateA = (a[propertyName] as Date).getTime();
			const dateB = (b[propertyName] as Date).getTime();
			return order === "asc" ? dateA - dateB : dateB - dateA;
		}

		if (typeof a[propertyName] === "number" && typeof b[propertyName] === "number") {
			return order === "asc"
				? Number(a[propertyName]) - Number(b[propertyName])
				: Number(b[propertyName]) - Number(a[propertyName]);
		}

		return 0;
	});

	return sortedArray;
};
