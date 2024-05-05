import { Interceptor } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-node";
import { BASE_URL } from "@constants/api.constants";
import { WorkspaceConfig } from "@utilities";

export const jwtInterceptor: Interceptor = (next) => async (req) => {
	const authToken = WorkspaceConfig.getFromWorkspace<string>("authToken", "");

	if (authToken) {
		req.header.set("Authorization", `Bearer ${authToken}`);
	}
	return await next(req);
};

export const grpcTransport = createConnectTransport({
	baseUrl: BASE_URL,
	httpVersion: "1.1",
	interceptors: [jwtInterceptor],
});
