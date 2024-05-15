import { ApplyService } from "@ak-proto-ts/apply/v1/svc_connect";
import { BuildsService } from "@ak-proto-ts/builds/v1/svc_connect";
import { DeploymentsService } from "@ak-proto-ts/deployments/v1/svc_connect";
import { EnvsService } from "@ak-proto-ts/envs/v1/svc_connect";
import { ProjectsService } from "@ak-proto-ts/projects/v1/svc_connect";
import { SessionsService } from "@ak-proto-ts/sessions/v1/svc_connect";
import { Interceptor } from "@connectrpc/connect";
import { createPromiseClient, PromiseClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-node";
import { ValidateURL, WorkspaceConfig } from "@utilities";

type GrpcTransport = ReturnType<typeof createConnectTransport>;

export let grpcTransport: GrpcTransport;
export let projectsClient: PromiseClient<typeof ProjectsService>;
export let environmentsClient: PromiseClient<typeof EnvsService>;
export let deploymentsClient: PromiseClient<typeof DeploymentsService>;
export let sessionsClient: PromiseClient<typeof SessionsService>;
export let manifestApplyClient: PromiseClient<typeof ApplyService>;
export let buildsClient: PromiseClient<typeof BuildsService>;

export function initializeGrpcTransportAndClients() {
	const baseURLFromVSCode: string = WorkspaceConfig.getFromWorkspace<string>("baseURL", "");
	const BASE_URL = ValidateURL(baseURLFromVSCode) ? baseURLFromVSCode : "";

	const jwtInterceptor: Interceptor = (next) => (req) => {
		const authToken = WorkspaceConfig.getFromWorkspace<string>("authToken", "");

		if (authToken) {
			req.header.set("Authorization", `Bearer ${authToken}`);
		}
		return next(req);
	};

	grpcTransport = createConnectTransport({
		baseUrl: BASE_URL,
		httpVersion: "1.1",
		interceptors: [jwtInterceptor],
	});

	projectsClient = createPromiseClient(ProjectsService, grpcTransport);
	environmentsClient = createPromiseClient(EnvsService, grpcTransport);
	deploymentsClient = createPromiseClient(DeploymentsService, grpcTransport);
	sessionsClient = createPromiseClient(SessionsService, grpcTransport);
	manifestApplyClient = createPromiseClient(ApplyService, grpcTransport);
	buildsClient = createPromiseClient(BuildsService, grpcTransport);
}

initializeGrpcTransportAndClients();
