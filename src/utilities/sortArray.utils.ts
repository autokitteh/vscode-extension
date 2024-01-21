import { SortOrder } from "@enums";

type WithOptionalProperty<TKey extends PropertyKey> = { [P in TKey]?: any };

export const sortArray = <TItem extends WithOptionalProperty<TKey>, TKey extends PropertyKey>(
	arr: TItem[] | undefined,
	propName: TKey,
	order: SortOrder = SortOrder.ASC
): void => {
	arr?.sort((a, b) => {
		const aProp: any = a[propName];
		const bProp: any = b[propName];
		let comparison = 0;

		if (typeof aProp === "number" && typeof bProp === "number") {
			comparison = aProp - bProp;
		} else if (typeof aProp === "string" && typeof bProp === "string") {
			comparison = aProp.localeCompare(bProp);
		} else if (aProp instanceof Date && bProp instanceof Date) {
			comparison = aProp.getTime() - bProp.getTime();
		} else {
			// Handle other types or mixed types here, if needed
			return 0;
		}

		return order === SortOrder.ASC ? comparison : -comparison;
	});
};
