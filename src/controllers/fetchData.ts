import {
	deploymentService,
	environmentService,
	projectService,
	userService,
} from "@services/services";
import { Deployment } from "@type/index";

export const fetchData = async (): Promise<{
	deployments: Deployment[];
	projectNamesStrArr: string[];
}> => {
	const myUser = await userService.getUserByName("george");
	const projects = await projectService.list(myUser!.userId);
	if (projects) {
		const projectNamesStrArr = projects?.map((project) => project.name) as string[];
		const environments = await environmentService.listFromArray(projects);
		if (!environments) {
			return { projectNamesStrArr, deployments: [] };
		}

		const deployments = (await deploymentService.list(environments![0].envId)) || [];
		return { projectNamesStrArr, deployments };
	}
	return { projectNamesStrArr: [], deployments: [] };
};
