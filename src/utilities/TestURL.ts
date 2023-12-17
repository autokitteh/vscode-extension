import { translate } from "@i18n/translation";
import { window } from "vscode";

export const TestURL = (url: string): string | undefined => {
	try {
		const configURL = new URL(url);
		const hostAddress = configURL.hostname;
		const hostPort = configURL.port;
		if (hostPort.length) {
			return `http://${hostAddress}:${hostPort}`;
		} else {
			return undefined;
		}
	} catch (er) {
		return undefined;
	}
};
