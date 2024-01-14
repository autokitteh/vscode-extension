import { SessionStateType as ProtoSessionStateType } from "@ak-proto-ts/sessions/v1/session_pb";
import { namespaces } from "@constants";
import { LoggerLevel, SessionStateType } from "@enums";
import { translate } from "@i18n";
import { LoggerService } from "@services";

export const sessionStateConverter = (sessionState: number): SessionStateType | undefined => {
	if (!ProtoSessionStateType[sessionState]) {
		return SessionStateType.unknown;
	}

	try {
		const sessionStateType = ProtoSessionStateType[sessionState].toLowerCase();
		return SessionStateType[sessionStateType as keyof typeof SessionStateType];
	} catch (error) {
		LoggerService.log(
			namespaces.deploymentsService,
			`${translate().t("errors.sessionStateConverterFailed")}: ${error}`,
			LoggerLevel.error
		);
		return SessionStateType.unknown;
	}
};
