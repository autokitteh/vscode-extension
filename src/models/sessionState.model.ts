import { SessionLogRecord as ProtoSessionLogRecord } from "@ak-proto-ts/sessions/v1/session_pb";
import { Value } from "@ak-proto-ts/values/v1/values_pb";
import { SessionLogStateTypes, SessionLogTypes } from "@enums";
import { translate } from "@i18n/index";
import { LoggerService } from "@services";
import { Callstack } from "@type/models";
import { convertTimestampToDate } from "@utilities";

export class SessionState {
	type: SessionLogTypes | undefined;
	state: SessionLogStateTypes | undefined;
	callstackTrace: Callstack[] = [];
	logs?: string[];
	error?: string;
	dateTime?: Date;

	constructor(session: ProtoSessionLogRecord) {
		const stateTypeMapping: Record<string, SessionLogTypes> = {
			callSpec: SessionLogTypes.callSpec,
			callAttemptComplete: SessionLogTypes.callAttemptComplete,
			callAttemptStart: SessionLogTypes.callAttemptStart,
			state: SessionLogTypes.state,
		};

		if (!session) {
			LoggerService.error(
				"SessionState",
				translate().t("errors.unexpectedSessionStateType", { error: "Session doesn't exist" })
			);
			return;
		}
		let sessionState = Object.keys(stateTypeMapping).find((key) => key in session);
		if (!sessionState) {
			if (session.print) {
				sessionState = SessionLogTypes.print;
			}
		}

		switch (sessionState) {
			case SessionLogTypes.callAttemptStart:
				this.type = SessionLogTypes.callAttemptStart;
				this.dateTime = convertTimestampToDate(session[SessionLogTypes.callAttemptStart]!.startedAt);
				break;
			case SessionLogTypes.callAttemptComplete:
				this.handleCallAttemptComplete(session);
				break;
			case SessionLogTypes.callSpec:
				this.handleFuncCall(session);
				break;
			case SessionLogTypes.state:
				this.state = Object.keys(session.state!)[0] as SessionLogStateTypes;
				this.logs = session.print ? [session.print] : [];
				if (this.state === SessionLogStateTypes.error) {
					this.error = session?.state?.error?.error?.message || translate().t("errors.sessionLogMissingOnErrorType");
					this.callstackTrace = (session?.state?.error?.error?.callstack || []) as Callstack[];
				}
				break;
			case SessionLogTypes.print:
				this.type = SessionLogTypes.print;
				this.logs = [`${translate().t("sessions.historyPrint")}: ${session.print}`];
				break;
		}

		if (!this.dateTime && session.t) {
			this.dateTime = convertTimestampToDate(session.t);
		}
	}

	private handleCallAttemptComplete(session: ProtoSessionLogRecord) {
		this.type = SessionLogTypes.callAttemptComplete;
		let functionResponse = session[this.type]?.result?.value?.struct?.fields?.body?.string?.v || "";
		const functionName = session[this.type]?.result?.value?.struct?.ctor?.string?.v || "";
		if (functionName === "time") {
			functionResponse = convertTimestampToDate(functionResponse).toISOString();
		}
		if (!functionName && !functionResponse) {
			this.logs = [];
			return;
		}
		this.logs = [`${translate().t("sessions.historyResult")}: ${functionName} - ${functionResponse}`];
	}

	private handleFuncCall(session: ProtoSessionLogRecord) {
		this.type = SessionLogTypes.callSpec;

		const functionName = session[this.type]?.function?.function?.name || "";
		const args = (session[this.type]?.args || [])
			.map((arg: Value) => arg.string?.v)
			.join(", ")
			.replace(/, ([^,]*)$/, "");
		this.logs = [`${translate().t("sessions.historyFunction")}: ${functionName}(${args})`];
	}

	getError(): string {
		return this.error!;
	}

	getCallstack(): Callstack[] {
		return this.callstackTrace;
	}

	isError(): boolean {
		return this.state === SessionLogStateTypes.error;
	}

	isRunning(): boolean {
		return this.state === SessionLogStateTypes.running;
	}

	isPrint(): boolean {
		return this.type === SessionLogTypes.print;
	}

	isFinished(): boolean {
		return this.state === SessionLogStateTypes.error || this.state === SessionLogStateTypes.completed;
	}

	containLogs(): boolean {
		return !!(this.logs && this.logs.length);
	}

	getLogs(): string[] {
		return this.logs || [];
	}
}
