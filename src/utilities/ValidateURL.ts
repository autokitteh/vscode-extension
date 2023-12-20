const validURLWithPort =
	// eslint-disable-next-line max-len
	/^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?(localhost|([a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}))(:[0-9]{1,5})?(\/.*)?$/i;

const validIpWithPort = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}:[0-9]{1,5}$/;

export const ValidateURL = (url: string): boolean =>
	validIpWithPort.test(url) || validURLWithPort.test(url);
