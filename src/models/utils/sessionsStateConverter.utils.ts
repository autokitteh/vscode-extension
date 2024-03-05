import { SessionStateType as ProtoSessionStateType } from "@ak-proto-ts/sessions/v1/session_pb";
import { namespaces } from "@constants";
import { SessionLogStateTypes } from "@enums";
import { LoggerService } from "@services";

export const sessionStateConverter = (sessionState: number): SessionLogStateTypes | undefined => {
	try {
		const sessionStateType = ProtoSessionStateType[sessionState].toLowerCase();
		return SessionLogStateTypes[sessionStateType as keyof typeof SessionLogStateTypes];
	} catch (error) {
		LoggerService.error(namespaces.sessionsHistory, (error as Error).message);
	}
	return;
};
