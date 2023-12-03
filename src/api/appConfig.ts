export const baseApi = "http://localhost:9980";
const urlPrefix = "autokitteh.";
export const appConfig = {
	accessToken: "<KEY>",
	projectApiBase: `${baseApi}/${urlPrefix}projects.v1.ProjectsService`,
	connectionApiBase: `${baseApi}/${urlPrefix}autokitteh.connections.v1.ConnectionsService`,
	environmentApiBase: `${baseApi}/${urlPrefix}autokitteh.envs.v1.EnvsService`,
	manifestApiBase: `${urlPrefix}x/apply`,
};
