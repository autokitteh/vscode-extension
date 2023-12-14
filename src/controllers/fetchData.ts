import { Deployment } from "@ak-proto-ts/deployments/v1/deployment_pb";
import { AuthService } from "@services/auth";
import { DeploymentsService } from "@services/deployments";
import { EnvironmentService } from "@services/environments";
import { ProjectService } from "@services/projects";

export const fetchBaseData = async (): Promise<{
	deployments: Deployment[];
	projectNamesStrArr: string[];
}> => {
	try {
		const myUser = await AuthService.whoAmI();
		const projects = await ProjectService.listForUser(myUser);

		if (projects.length) {
			const projectNamesStrArr = projects.map((project) => project.name);
			const environments = await EnvironmentService.listForProjects(projects);

			if (!environments || !environments.length) {
				return { projectNamesStrArr, deployments: [] };
			}
			const deployments = await DeploymentsService.listForEnvironments(environments);

			return { projectNamesStrArr, deployments };
		}
	} catch (error) {
		console.error(error);
	}

	return { projectNamesStrArr: [], deployments: [] };
};
