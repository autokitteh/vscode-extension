import { createConnectTransport } from "@connectrpc/connect-node";
import { BASE_URL } from "@constants";

export const grpcTransport = createConnectTransport({
	baseUrl: BASE_URL,
	httpVersion: "1.1",
});
