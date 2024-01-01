import { SortOrder } from "@enums/sortOrder.enum";

export const sortArray = <T>(
	array: T[] | undefined,
	propertyName: keyof T,
	order: SortOrder = SortOrder.ASC
): T[] | undefined => {
	if (!array) {
		return array;
	}

	return [...array].sort((a, b) => {
		const aValue = a[propertyName];
		const bValue = b[propertyName];

		// Handle cases where either or both values are undefined
		if (aValue === undefined && bValue === undefined) {
			return 0;
		}
		if (aValue === undefined) {
			return order === SortOrder.ASC ? 1 : -1;
		}
		if (bValue === undefined) {
			return order === SortOrder.ASC ? -1 : 1;
		}

		// Comparing Dates
		if (aValue instanceof Date && bValue instanceof Date) {
			return order === SortOrder.ASC
				? aValue.getTime() - bValue.getTime()
				: bValue.getTime() - aValue.getTime();
		}

		// Comparing Numbers and Strings
		const aNum = Number(aValue);
		const bNum = Number(bValue);
		if (!isNaN(aNum) && !isNaN(bNum)) {
			return order === SortOrder.ASC ? aNum - bNum : bNum - aNum;
		}

		// Fallback to string comparison
		return order === SortOrder.ASC
			? String(aValue).localeCompare(String(bValue))
			: String(bValue).localeCompare(String(aValue));
	});
};
