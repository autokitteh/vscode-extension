import ApiClient from "./api/axios/apiClient";
import ManifestService, { ManifestApiClient } from "./api/entities/manifest";
import ProjectService, { ProjectApiClient } from "./api/entities/project";

const projectApiClient = new ProjectApiClient(new ApiClient());
export const projectService = new ProjectService(projectApiClient);

const manifestApiClient = new ManifestApiClient(new ApiClient());
export const manifestService = new ManifestService(manifestApiClient);
