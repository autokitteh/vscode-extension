import { ApiClient } from "@api";
import {
    IntegrationApiClient,
    IntegrationService,
    ManifestApiClient, ManifestService,
    OrganizationApiClient, OrganizationService, UserApiClient, UserService
} from "@api/entities";
import { ProjectService, ProjectApiClient } from "@api/entities";

const projectApiClient = new ProjectApiClient(new ApiClient());
const projectService = new ProjectService(projectApiClient);

const manifestApiClient = new ManifestApiClient(new ApiClient());
const manifestService = new ManifestService(manifestApiClient);

const organizationApiClient = new OrganizationApiClient(new ApiClient());
const organizationService = new OrganizationService(organizationApiClient);

const integrationApiClient = new IntegrationApiClient(new ApiClient());
const integrationService = new IntegrationService(integrationApiClient);

const userApiClient = new UserApiClient(new ApiClient());
const userService = new UserService(userApiClient);

export { projectService, manifestService, organizationService, integrationService, userService };
