import { SessionLogRecord as ProtoSessionLogRecord } from "@ak-proto-ts/sessions/v1/session_pb";
import { Value } from "@ak-proto-ts/values/v1/values_pb";
import { namespaces } from "@constants";
import { SessionStateType, SessionLogRecordType } from "@enums";
import { translate } from "@i18n/index";
import { convertErrorProtoToModel } from "@models/error.model";
import { LoggerService } from "@services";
import { Callstack } from "@type/models";
import { convertTimestampToDate } from "@utilities";

export class SessionLogRecord {
	type: SessionLogRecordType = SessionLogRecordType.unknown;
	state?: SessionStateType;
	callstackTrace: Callstack[] = [];
	logs?: string;
	error?: string;
	dateTime?: Date;

	constructor(logRecord: ProtoSessionLogRecord) {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { t, ...props } = logRecord;
		if (Object.keys(props).length > 1) {
			LoggerService.error(
				namespaces.sessionsHistory,
				`More than one session log record type found: ${Object.keys(props).join(", ")}`
			);
			return;
		}
		const logRecordType = Object.keys(props)[0] as SessionLogRecordType;

		switch (logRecordType) {
			case SessionLogRecordType.callAttemptStart:
				this.type = SessionLogRecordType.callAttemptStart;
				this.dateTime = convertTimestampToDate(logRecord[SessionLogRecordType.callAttemptStart]!.startedAt);
				break;
			case SessionLogRecordType.callAttemptComplete:
				this.handleCallAttemptComplete(logRecord);
				break;
			case SessionLogRecordType.callSpec:
				this.handleFuncCall(logRecord);
				break;
			case SessionLogRecordType.state:
				this.handleStateRecord(logRecord);
				break;
			case SessionLogRecordType.print:
				this.type = SessionLogRecordType.print;
				this.logs = `${translate().t("sessions.historyPrint")}: ${logRecord.print!.text}`;
				break;
		}

		if (logRecordType !== SessionLogRecordType.callAttemptStart) {
			this.dateTime = convertTimestampToDate(logRecord.t);
		}
	}

	private handleStateRecord(logRecord: ProtoSessionLogRecord) {
		this.type = SessionLogRecordType.state;
		this.state = Object.keys(logRecord.state!)[0] as SessionStateType;
		if (this.state === SessionStateType.running) {
			const functionRunning = logRecord.state?.running?.call?.function?.name;
			this.logs = functionRunning ? `${translate().t("sessions.historyInitFunction")}: ${functionRunning}` : undefined;
		}
		if (this.state === SessionStateType.error) {
			this.error = convertErrorProtoToModel(
				logRecord.state?.error?.error?.value,
				translate().t("errors.sessionLogMissingOnErrorType")
			)?.message;
			this.callstackTrace = (logRecord?.state?.error?.error?.callstack || []) as Callstack[];
		}
	}

	private handleCallAttemptComplete(logRecord: ProtoSessionLogRecord) {
		this.type = SessionLogRecordType.callAttemptComplete;

		if (logRecord[this.type]?.result?.value?.time) {
			this.logs =
				// eslint-disable-next-line max-len
				`${translate().t("sessions.historyFunction")} - ${translate().t("sessions.historyResult")}: ${translate().t("sessions.historyTime")} - ${convertTimestampToDate(logRecord[this.type]?.result?.value?.time?.v).toISOString()}`;

			return;
		}
		if (logRecord[this.type]?.result?.value?.nothing) {
			this.logs =
				// eslint-disable-next-line max-len
				`${translate().t("sessions.historyFunction")} - ${translate().t("sessions.historyResult")}: ${translate().t("sessions.historyNoOutput")}`;
			return;
		}

		let functionResponse = logRecord[this.type]?.result?.value?.struct?.fields?.body?.string?.v || "";
		let functionName = logRecord[this.type]?.result?.value?.struct?.ctor?.string?.v || "";

		if (!functionName && !functionResponse) {
			this.logs = undefined;
			return;
		}
		this.logs =
			// eslint-disable-next-line max-len
			`${translate().t("sessions.historyFunction")} - ${translate().t("sessions.historyResult")}: ${functionName} - ${functionResponse}`;
	}

	private handleFuncCall(logRecord: ProtoSessionLogRecord) {
		this.type = SessionLogRecordType.callSpec;

		const functionName = logRecord[this.type]?.function?.function?.name || "";
		const args = (logRecord[this.type]?.args || [])
			.map((arg: Value) => arg.string?.v)
			.join(", ")
			.replace(/, ([^,]*)$/, "");
		this.logs = `${translate().t("sessions.historyFunction")}: ${functionName}(${args})`;
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

	getLogs(): string | undefined {
		return this.logs;
	}
}