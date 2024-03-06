import { SessionLogRecord as ProtoSessionLogRecord } from "@ak-proto-ts/sessions/v1/session_pb";
import { Value } from "@ak-proto-ts/values/v1/values_pb";
import { SessionStateType, SessionLogRecordType } from "@enums";
import { translate } from "@i18n/index";
import { Callstack } from "@type/models";
import { convertTimestampToDate } from "@utilities";

export class SessionLogRecord {
	type: SessionLogRecordType | undefined;
	state: SessionStateType | undefined;
	callstackTrace: Callstack[] = [];
	logs?: string[];
	error?: string;
	dateTime?: Date;

	constructor(session: ProtoSessionLogRecord) {
		let sessionState = Object.keys(SessionLogRecordType).find((key) => key in session);
		if (!sessionState && session.print) {
			sessionState = SessionLogRecordType.print;
		}

		switch (sessionState) {
			case SessionLogRecordType.callAttemptStart:
				this.type = SessionLogRecordType.callAttemptStart;
				this.dateTime = convertTimestampToDate(session[SessionLogRecordType.callAttemptStart]!.startedAt);
				break;
			case SessionLogRecordType.callAttemptComplete:
				this.handleCallAttemptComplete(session);
				break;
			case SessionLogRecordType.callSpec:
				this.handleFuncCall(session);
				break;
			case SessionLogRecordType.state:
				this.type = SessionLogRecordType.state;
				this.state = Object.keys(session.state!)[0] as SessionStateType;
				this.logs = session.print ? [session.print.text] : [];
				if (this.state === SessionStateType.error) {
					this.error = session?.state?.error?.error?.message || translate().t("errors.sessionLogMissingOnErrorType");
					this.callstackTrace = (session?.state?.error?.error?.callstack || []) as Callstack[];
				}
				break;
			case SessionLogRecordType.print:
				this.type = SessionLogRecordType.print;
				this.logs = [`${translate().t("sessions.historyPrint")}: ${session.print!.text}`];
				break;
		}

		if (!this.dateTime && session.t) {
			this.dateTime = convertTimestampToDate(session.t);
		}
	}

	private handleCallAttemptComplete(session: ProtoSessionLogRecord) {
		this.type = SessionLogRecordType.callAttemptComplete;
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
		this.type = SessionLogRecordType.callSpec;

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
		return this.state === SessionStateType.error;
	}

	isRunning(): boolean {
		return this.state === SessionStateType.running;
	}

	isPrint(): boolean {
		return this.type === SessionLogRecordType.print;
	}

	isFinished(): boolean {
		return this.state === SessionStateType.error || this.state === SessionStateType.completed;
	}

	containLogs(): boolean {
		return !!(this.logs && this.logs.length);
	}

	getLogs(): string[] {
		return this.logs || [];
	}
}
