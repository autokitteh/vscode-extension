import { ApplyService } from "@ak-proto-ts/apply/v1/svc_connect";
import { AuthService } from "@ak-proto-ts/auth/v1/svc_connect";
import { BuildsService } from "@ak-proto-ts/builds/v1/svc_connect";
import { ConnectionsService } from "@ak-proto-ts/connections/v1/svc_connect";
import { DeploymentsService } from "@ak-proto-ts/deployments/v1/svc_connect";
import { IntegrationsService } from "@ak-proto-ts/integrations/v1/svc_connect";
import { OrgsService } from "@ak-proto-ts/orgs/v1/svc_connect";
import { ProjectsService } from "@ak-proto-ts/projects/v1/svc_connect";
import { SessionsService } from "@ak-proto-ts/sessions/v1/svc_connect";
import { grpcTransport } from "@api/grpc/transport.grpc.api";
import { createPromiseClient } from "@connectrpc/connect";

export const organizationsClient = createPromiseClient(OrgsService, grpcTransport);
export const projectsClient = createPromiseClient(ProjectsService, grpcTransport);
export const deploymentsClient = createPromiseClient(DeploymentsService, grpcTransport);
export const sessionsClient = createPromiseClient(SessionsService, grpcTransport);
export const manifestApplyClient = createPromiseClient(ApplyService, grpcTransport);
export const buildsClient = createPromiseClient(BuildsService, grpcTransport);
export const connectionsClient = createPromiseClient(ConnectionsService, grpcTransport);
export const integrationsClient = createPromiseClient(IntegrationsService, grpcTransport);
export const authClient = createPromiseClient(AuthService, grpcTransport);
