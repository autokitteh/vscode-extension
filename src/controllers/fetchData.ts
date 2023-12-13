import { Deployment } from "@ak-proto-ts/deployments/v1/deployment_pb";
import {
	authService,
	deploymentsService,
	environmentsService,
	projectsService,
	usersService,
} from "@services/services";
import { flattenArray } from "@utilities/flattenArray";
import { get } from "lodash";

export const fetchBaseData = async (): Promise<{
	deployments: Deployment[];
	projectNamesStrArr: string[];
}> => {
	// TODO: Refactor to manage possible errors, and reduce the depth of the promises calls below
	const myUser = await authService.whoAmI({});
	let projects;
	try {
		projects = await projectsService.listForOwner({ ownerId: myUser.user?.userId });
	} catch (e) {
		console.error(e);
	}
	if (projects?.projects) {
		const projectNamesStrArr = projects?.projects.map((project) => project.name);
		const environments = flattenArray(
			await Promise.all(
				projects.projects.map((project) =>
					environmentsService.list({
						parentId: project.projectId,
					})
				)
			),
			"envs"
		);
		if (!environments) {
			return { projectNamesStrArr, deployments: [] };
		}
		const deployments = flattenArray(
			await Promise.all(
				environments.map((environment) =>
					deploymentsService.list({
						envId: get(environment, "envId"),
					})
				)
			),
			"deployments"
		) as Deployment[];
		return { projectNamesStrArr, deployments };
	}
	return { projectNamesStrArr: [], deployments: [] };
};
