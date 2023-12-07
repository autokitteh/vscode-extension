import { ApiClient } from "@api/index";
import { ManifestApiClient, ManifestService } from "@api/entities";
import { ProjectService, ProjectApiClient } from "@api/entities";

const projectApiClient = new ProjectApiClient(new ApiClient());
const projectService = new ProjectService(projectApiClient);

const manifestApiClient = new ManifestApiClient(new ApiClient());
const manifestService = new ManifestService(manifestApiClient);

export { projectService, manifestService };
