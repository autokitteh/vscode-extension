import { jwtInterceptor } from "@api/grpc/jwtInterceptor.grpc.api";
import { createConnectTransport } from "@connectrpc/connect-node";
import { BASE_URL } from "@constants/api.constants";

export const grpcTransport = createConnectTransport({
	baseUrl: BASE_URL,
	httpVersion: "1.1",
	interceptors: [jwtInterceptor],
});
