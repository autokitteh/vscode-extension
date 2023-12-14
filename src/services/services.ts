import { AuthService } from "@ak-proto-ts/auth/v1/svc_connect";
import { DeploymentsService } from "@ak-proto-ts/deployments/v1/svc_connect";
import { EnvsService } from "@ak-proto-ts/envs/v1/svc_connect";
import { ProjectsService } from "@ak-proto-ts/projects/v1/svc_connect";
import { UsersService } from "@ak-proto-ts/users/v1/svc_connect";
import { ApiClient } from "@api/index";
import { ManifestService } from "@api/manifest";
import { createPromiseClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-node";

const transport = createConnectTransport({
	baseUrl: "http://localhost:9980",
	httpVersion: "1.1",
});

export const projectsClient = createPromiseClient(ProjectsService, transport);
export const usersClient = createPromiseClient(UsersService, transport);
export const environmentsClient = createPromiseClient(EnvsService, transport);
export const deploymentsClient = createPromiseClient(DeploymentsService, transport);
export const authClient = createPromiseClient(AuthService, transport);

const apiClient = new ApiClient();
export const manifestClient = new ManifestService(apiClient);
