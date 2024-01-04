import { sessionsClient } from "@api/grpc/clients.grpc.api";
import { translate } from "@i18n";
import { convertSessionProtoToModel } from "@models/session.model";
import { convertSessionHistoryProtoToModel } from "@models/sessionHistory.model";
import { EnvironmentsService } from "@services/environments.service";
import { Session, SessionHistory } from "@type/models";
import { ServiceResponse } from "@type/services.types";
import { flattenArray } from "@utilities";
import { get } from "lodash";
import { window } from "vscode";

export class SessionsService {
	static async listByEnvironmentId(environmentId: string): Promise<ServiceResponse<Session[]>> {
		try {
			const response = await sessionsClient.list({ envId: environmentId });
			const sessions = response.sessions.map(convertSessionProtoToModel);
			return { data: sessions, error: undefined };
		} catch (error) {
			return { data: undefined, error };
		}
	}

	static async getSessionHistory(sessionId: string): Promise<ServiceResponse<SessionHistory>> {
		try {
			let output = window.createOutputChannel("autokitteh");
			output.clear();

			const response = await sessionsClient.getHistory({ sessionId });
			const sessionHistory = convertSessionHistoryProtoToModel(response.history?.states);
			type StateValue = {
				runId?: string;
				prints?: string[];
				call?: {
					type: {
						value: {
							signature: string;
							argNames: string[];
							name: string;
						};
					};
				};
				exports?: any;
			};

			type State = {
				case: string;
				value: StateValue;
			};

			type Timestamp = {
				seconds: number | bigint;
				nanos: number;
			};

			type Entry = {
				states: State;
				t: Timestamp;
			};

			type Data = {
				states: Entry[];
				calls: any[];
			};

			sessionHistory.forEach((entry) => {
				const stateCase = entry.states.case;
				const value = entry.states.value as any;

				output.appendLine(`Status: ${stateCase}\r\n`);

				if (stateCase === "running" || stateCase === "completed") {
					// Print function call if available
					if (value.call) {
						const callInfo = value.call.type.value;
						const functionCall = `${callInfo.name}(${callInfo.argNames.join(", ")})`;
						output.appendLine(`Function Call: ${functionCall}\r\n`);
					}

					// Print 'prints' array contents
					if (value.prints && value.prints.length > 0) {
						output.appendLine("Prints:\r\n");
						value.prints.forEach((print: string) => {
							output.appendLine(`  ${print}\r\n`);
						});
					}
				}

				if (stateCase === "error") {
					const errorMessage = value?.error.message;
					output.appendLine(`Errors: ${errorMessage}\r\n`);
				}

				output.appendLine("~~~~~~~~~~~~~~~~~~"); // Blank line for separation
			});
			output.show();

			return { data: undefined, error: undefined };
		} catch (error) {
			return { data: undefined, error };
		}
	}

	static async listByDeploymentId(deploymentId: string): Promise<ServiceResponse<Session[]>> {
		try {
			const response = await sessionsClient.list({ deploymentId });
			const sessions = response.sessions.map((session) => convertSessionProtoToModel(session));
			return { data: sessions, error: undefined };
		} catch (error) {
			return { data: undefined, error };
		}
	}

	static async listByProjectId(projectId: string): Promise<ServiceResponse<Session[]>> {
		try {
			const { data: projectEnvironments } = await EnvironmentsService.listByProjectId(projectId);

			if (projectEnvironments) {
				const sessionsPromises = projectEnvironments.map(async (environment) => {
					const sessions = await this.listByEnvironmentId(environment.envId);
					return sessions;
				});

				const sessionsResponses = await Promise.allSettled(sessionsPromises);

				const sessions = flattenArray<Session>(
					sessionsResponses
						.filter((response) => response.status === "fulfilled")
						.map((response) =>
							get(response, "value.sessions", []).map((session) =>
								convertSessionProtoToModel(session)
							)
						)
				);

				return { data: sessions, error: undefined };
			} else {
				return {
					data: undefined,
					error: new Error(translate().t("errors.projectEnvironmentsNotFound")),
				};
			}
		} catch (error) {
			return {
				data: undefined,
				error,
			};
		}
	}
}
