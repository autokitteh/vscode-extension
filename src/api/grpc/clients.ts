import { AuthService } from "@ak-proto-ts/auth/v1/svc_connect";
import { DeploymentsService } from "@ak-proto-ts/deployments/v1/svc_connect";
import { EnvsService } from "@ak-proto-ts/envs/v1/svc_connect";
import { ProjectsService } from "@ak-proto-ts/projects/v1/svc_connect";
import { UsersService } from "@ak-proto-ts/users/v1/svc_connect";
import { ApiClient } from "@api";
import { grpcTransport } from "@api/grpc/transport";
import { ManifestService } from "@api/manifest";
import { createPromiseClient } from "@connectrpc/connect";

export const projectsClient = createPromiseClient(ProjectsService, grpcTransport);
export const usersClient = createPromiseClient(UsersService, grpcTransport);
export const environmentsClient = createPromiseClient(EnvsService, grpcTransport);
export const deploymentsClient = createPromiseClient(DeploymentsService, grpcTransport);
export const authClient = createPromiseClient(AuthService, grpcTransport);

const apiClient = new ApiClient();
export const manifestClient = new ManifestService(apiClient);
