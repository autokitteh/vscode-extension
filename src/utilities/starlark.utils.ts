import { ValidateURL } from "@utilities/validateUrl.utils";

export const isStalarkLSPSocketMode = (path: string): boolean => {
	if (ValidateURL(path)) {
		const pathURL = new URL(path);
		return pathURL.protocol === "http:" || pathURL.protocol === "https:";
	}
	return false;
};
