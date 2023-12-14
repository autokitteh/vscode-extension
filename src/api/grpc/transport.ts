import { createConnectTransport } from "@connectrpc/connect-node";
import { HOST_URL } from "@constants/api";

export const grpcTransport = createConnectTransport({
	baseUrl: HOST_URL,
	httpVersion: "1.1",
});
