export const baseApi = "http://localhost:9980";
const urlPrefix = "autokitteh.";
export const appConfig = {
	accessToken: "<KEY>",
	projectApiBase: `${baseApi}/${urlPrefix}projects.v1.ProjectsService`,
	connectionApiBase: `${baseApi}/${urlPrefix}connections.v1.ConnectionsService`,
	environmentApiBase: `${baseApi}/${urlPrefix}envs.v1.EnvsService`,
	organizationApiBase: `${baseApi}/${urlPrefix}orgs.v1.OrgsService`,
	integrationApiBase: `${baseApi}/${urlPrefix}integrations.v1.IntegrationsService`,
	userApiBase: `${baseApi}/${urlPrefix}users.v1.UsersService`,
	manifestApiBase: baseApi,
	deploymentApiBase: `${baseApi}/${urlPrefix}deployments.v1.DeploymentsService`,
};
