import { Deployment as ProtoDeployment } from "@ak-proto-ts/deployments/v1/deployment_pb";
import { SessionsService } from "@services";
import pick from "lodash/pick";

export class Deployment {
	sessionsCount: number;
	envId: string;

	constructor(deployment: ProtoDeployment) {
		Object.assign(this, pick(deployment, ["deploymentId", "buildId", "createdAt", "state"]));
		this.sessionsCount = 0;
		this.envId = "";
		this.fetchSessions();
	}

	private async fetchSessions() {
		this.sessionsCount = (await SessionsService.listByEnvironmentId(this.envId)).length;
	}
}
