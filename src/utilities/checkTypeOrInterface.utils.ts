export const isTypeOrInterface = <T>(item: any, singlePropfTypeOrInterface: string): item is T => {
	return singlePropfTypeOrInterface in item;
};
