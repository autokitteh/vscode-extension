import { SessionStateType as ProtoSessionStateType } from "@ak-proto-ts/sessions/v1/session_pb";
import { namespaces } from "@constants";
import { SessionStateType } from "@enums";
import { LoggerService } from "@services";

export const sessionStateConverter = (sessionState: number): SessionStateType | undefined => {
	try {
		const sessionStateType = ProtoSessionStateType[sessionState].toLowerCase();
		return SessionStateType[sessionStateType as keyof typeof SessionStateType];
	} catch (error) {
		LoggerService.error(namespaces.sessionsHistory, (error as Error).message);
	}
	return;
};
