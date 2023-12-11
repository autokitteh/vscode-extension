import { ApiClient } from "@api";
import {
	DeploymentService,
	EnvironmentService,
	IntegrationService,
	ManifestService,
	OrganizationService,
	ProjectService,
	UserService,
} from "@api/entities";

// Create a single instance of ApiClient
const apiClient = new ApiClient();

const projectService = new ProjectService(apiClient);
const manifestService = new ManifestService(apiClient);
const organizationService = new OrganizationService(apiClient);
const integrationService = new IntegrationService(apiClient);
const userService = new UserService(apiClient);
const environmentService = new EnvironmentService(apiClient);
const deploymentService = new DeploymentService(apiClient);

export {
	deploymentService,
	environmentService,
	integrationService,
	manifestService,
	organizationService,
	projectService,
	userService,
};
