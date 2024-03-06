import { SessionStateType as ProtoSessionStateType } from "@ak-proto-ts/sessions/v1/session_pb";
import { namespaces } from "@constants";
import { StateOfSessionLogType } from "@enums";
import { LoggerService } from "@services";

export const sessionStateConverter = (sessionState: number): StateOfSessionLogType | undefined => {
	try {
		const sessionStateType = ProtoSessionStateType[sessionState].toLowerCase();
		return StateOfSessionLogType[sessionStateType as keyof typeof StateOfSessionLogType];
	} catch (error) {
		LoggerService.error(namespaces.sessionsHistory, (error as Error).message);
	}
	return;
};
