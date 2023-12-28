import { sessionsClient } from "@api/grpc/clients.grpc.api";
import { handlegRPCErrors } from "@api/grpc/errorHandler.grpc.api";
import { Session } from "@models/session.model";
import { EnvironmentsService } from "@services/environments.service";
import { SessionType } from "@type/models/session.type";
import { flattenArray } from "@utilities";
import { get } from "lodash";

export class SessionsService {
	static async listByEnvironmentId(environmentId: string): Promise<SessionType[]> {
		try {
			const protoSessions = (await sessionsClient.list({ envId: environmentId })).sessions;
			return protoSessions.map((protoSession) => Session(protoSession));
		} catch (error) {
			handlegRPCErrors(error);
		}
		return [];
	}

	static async listByDeploymentId(deploymentId: string): Promise<SessionType[]> {
		try {
			const sessions = await sessionsClient.list({ deploymentId });
			const protoSessions = sessions.sessions;
			return protoSessions.map((protoSession) => Session(protoSession));
		} catch (error) {
			handlegRPCErrors(error);
		}
		return [];
	}

	static async listByProjectId(projectId: string): Promise<SessionType[]> {
		try {
			const projectEnvironments = await EnvironmentsService.listByProjectId(projectId);
			const sessionsPromises = projectEnvironments.map(async (environment) => {
				return await this.listByEnvironmentId(environment.envId);
			});
			const sessionsResponses = await Promise.allSettled(sessionsPromises);
			return flattenArray<SessionType>(
				sessionsResponses
					.filter((response) => response.status === "fulfilled")
					.map((response) => get(response, "value", []))
			);
		} catch (error) {
			handlegRPCErrors(error);
		}
		return [];
	}
}
