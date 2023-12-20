export const ValidateURL = (url: string): boolean => {
	try {
		return !!new URL(url);
	} catch (er) {
		return false;
	}
};
