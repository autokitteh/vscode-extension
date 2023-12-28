import { sessionsClient } from "@api/grpc/clients.grpc.api";
import { handlegRPCErrors } from "@api/grpc/errorHandler.grpc.api";
import { convertSessionProtoToTS } from "@models/session.model";
import { Session } from "@type/models/session.type";

export class SessionsService {
	// static async listByEnvironmentId(environmentId: string): Promise<Session[]> {
	// 	try {
	// 		const protoSessions = (await sessionsClient.list({ envId: environmentId })).sessions;
	// 		return protoSessions.map((protoSession) => convertSessionProtoToTS(protoSession));
	// 	} catch (error) {
	// 		handlegRPCErrors(error);
	// 	}
	// 	return [];
	// }

	static async listByDeploymentId(deploymentId: string): Promise<Session[]> {
		try {
			const sessions = await sessionsClient.list({ deploymentId });
			const protoSessions = sessions.sessions;
			return protoSessions.map((protoSession) => convertSessionProtoToTS(protoSession));
		} catch (error) {
			handlegRPCErrors(error);
		}
		return [];
	}

	// static async listByProjectId(projectId: string): Promise<Session[]> {
	// 	try {
	// 		const projectEnvironments = await EnvironmentsService.listByProjectId(projectId);
	// 		const sessionsPromises = projectEnvironments.map(async (environment) => {
	// 			return await this.listByEnvironmentId(environment.envId);
	// 		});
	// 		const sessionsResponses = await Promise.allSettled(sessionsPromises);
	// 		return flattenArray<Session>(
	// 			sessionsResponses
	// 				.filter((response) => response.status === "fulfilled")
	// 				.map((response) => get(response, "value", []))
	// 		);
	// 	} catch (error) {
	// 		handlegRPCErrors(error);
	// 	}
	// 	return [];
	// }
}
