export const TestURL = (url: string): string | undefined => {
	try {
		const configURL = new URL(url);
		const urlAddress = configURL.hostname;
		const urlPort = configURL.port;
		if (urlPort.length) {
			return `http://${urlAddress}:${urlPort}`;
		} else {
			return undefined;
		}
	} catch (er) {
		return undefined;
	}
};
