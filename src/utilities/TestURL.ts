// TODO: Don't manipulate URL, only validate
export const TestURL = (url: string): string | undefined => {
	try {
		const configURL = new URL(url);
		const urlAddress = configURL.hostname;
		const urlPort = configURL.port;
		return urlPort.length && urlAddress.length ? `http://${urlAddress}:${urlPort}` : undefined;
	} catch (er) {
		return undefined;
	}
};
