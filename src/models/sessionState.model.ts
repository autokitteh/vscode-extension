import { SessionLogRecord } from "@ak-proto-ts/sessions/v1/session_pb";
import { Value } from "@ak-proto-ts/values/v1/values_pb";
import { SessionStateType } from "@enums";
import { translate } from "@i18n/index";
import { LoggerService } from "@services";
import { Callstack } from "@type/models";
import { convertTimestampToDate } from "@utilities";

export class SessionState {
	type: SessionStateType = SessionStateType.unknown;
	callstackTrace: Callstack[] = [];
	logs?: string[];
	error?: string;
	call?: object;
	dateTime?: Date;

	constructor(session: SessionLogRecord) {
		const stateTypeMapping: Record<string, SessionStateType> = {
			callSpec: SessionStateType.callSpec,
			callAttemptComplete: SessionStateType.callAttemptComplete,
			callAttemptStart: SessionStateType.callAttemptStart,
			error: SessionStateType.error,
			print: SessionStateType.print,
		};

		const state = session.state ?? session;

		if (!session) {
			LoggerService.error(
				"SessionState",
				translate().t("errors.unexpectedSessionStateType", { error: "Session doesn't exist" })
			);
			return;
		}

		const sessionState = Object.keys(stateTypeMapping).find((key) => key in state) ?? Object.keys(state)[0];

		const unhandledSessionStates = ["created", "running", "error", "completed"];

		switch (sessionState) {
			case SessionStateType.callAttemptStart:
				this.type = SessionStateType.callAttemptStart;
				this.dateTime = convertTimestampToDate(session[SessionStateType.callAttemptStart]?.startedAt);
				break;
			case SessionStateType.callAttemptComplete:
				this.handleCallAttemptComplete(session);
				break;
			case SessionStateType.callSpec:
				this.handleFuncCall(session);
				break;
			case SessionStateType.print:
				this.type = SessionStateType.print;
				this.logs = [`${translate().t("sessions.historyPrint")}: ${session.print}`];
				break;
			default:
				if (!unhandledSessionStates.includes(sessionState)) {
					throw new Error(
						translate().t("errors.unexpectedSessionStateType", { error: "Session history state type doesn't exist" })
					);
				}
				this.handleDefaultCase(session);
		}

		if (this.dateTime === undefined) {
			this.setDateTime(session);
		}
		this.setErrorAndCallstack(session);
	}

	private handleDefaultCase(session: SessionLogRecord) {
		const stateCase = Object.keys(session.state || {})[0] as SessionStateType;
		if (!stateCase || !(stateCase in SessionStateType)) {
			this.type = SessionStateType.unknown;
		} else if (stateCase) {
			this.type = stateCase as SessionStateType;
			this.logs = session.print ? [session.print] : [];
		}
	}

	private handleCallAttemptComplete(session: SessionLogRecord) {
		this.type = SessionStateType.callAttemptComplete;
		let functionResponse = session[this.type]?.result?.value?.struct?.fields?.body?.string?.v || "";
		const functionName = session[this.type]?.result?.value?.struct?.ctor?.string?.v || "";
		if (functionName === "time") {
			functionResponse = convertTimestampToDate(functionResponse).toISOString();
		}
		if (functionName === "" && functionResponse === "") {
			this.logs = [];
			return;
		}
		this.logs = [`${translate().t("sessions.historyResult")}: ${functionName} - ${functionResponse}`];
	}

	private handleFuncCall(session: SessionLogRecord) {
		this.type = SessionStateType.callSpec;

		const functionName = session[this.type]?.function?.function?.name || "";
		const args = (session[this.type]?.args || [])
			.map((arg: Value) => arg.string?.v)
			.join(", ")
			.replace(/, ([^,]*)$/, "");
		this.logs = [`${translate().t("sessions.historyFunction")}: ${functionName}(${args})`];
	}

	private setDateTime(session: SessionLogRecord) {
		try {
			this.dateTime = convertTimestampToDate(session.t);
		} catch (error) {}
	}

	private setErrorAndCallstack(session: SessionLogRecord) {
		this.error = session?.state?.error?.error?.message || translate().t("errors.sessionLogMissingOnErrorType");
		this.callstackTrace = (session?.state?.error?.error?.callstack || []) as Callstack[];
	}

	getError(): string {
		return this.error!;
	}

	getCallstack(): Callstack[] {
		return this.callstackTrace;
	}

	isError(): boolean {
		return this.type === SessionStateType.error;
	}

	isRunning(): boolean {
		return this.type === SessionStateType.running;
	}

	isPrint(): boolean {
		return this.type === SessionStateType.print;
	}

	isFinished(): boolean {
		return this.type === SessionStateType.error || this.type === SessionStateType.completed;
	}

	containLogs(): boolean {
		return !!(this.logs && this.logs.length);
	}

	getLogs(): string[] {
		return this.logs || [];
	}
}
