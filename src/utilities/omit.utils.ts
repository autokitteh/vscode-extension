export const omit = (object: object, keysToOmit: string[]) => {
	return Object.fromEntries(Object.entries(object).filter(([key]) => !keysToOmit.includes(key)));
};
