import { SessionLogRecord as ProtoSessionLogRecord } from "@ak-proto-ts/sessions/v1/session_pb";
import { Value } from "@ak-proto-ts/values/v1/values_pb";
import { namespaces } from "@constants";
import { SessionStateType, SessionLogRecordType } from "@enums";
import { translate } from "@i18n";
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
		const { t, processId, ...props } = logRecord;

		const logRecordType = this.getLogRecordType(props);

		if (!logRecordType) {
			LoggerService.error(
				namespaces.sessionsHistory,
				translate().t("errors.sessionLogRecordTypeNotFound", { props: Object.keys(props).join(", ") })
			);
			return;
		}

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
		}

		if (logRecordType !== SessionLogRecordType.callAttemptStart) {
			this.dateTime = convertTimestampToDate(logRecord.t);
		}
	}

	private getLogRecordType(props: { [key: string]: any }): SessionLogRecordType | undefined {
		const activeKey = Object.keys(props).find((key) => props[key] !== undefined);

		if (activeKey && activeKey in SessionLogRecordType) {
			return activeKey as SessionLogRecordType;
		}
		return undefined;
	}

	private handleStateRecord(logRecord: ProtoSessionLogRecord) {
		this.type = SessionLogRecordType.state;
		const activeKey = Object.keys(logRecord.state!).find(
			(key) =>
				logRecord.state?.[key as unknown as SessionStateType] !== undefined &&
				typeof logRecord.state?.[key as unknown as SessionStateType] === "object"
		);
		this.state = activeKey as SessionStateType;
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

		const sessionLogRecord = logRecord[this.type];
		if (sessionLogRecord?.result?.value?.time) {
			this.logs = `${translate().t("sessions.historyFunction")} - 
					${translate().t("sessions.historyResult")}: ${translate().t("sessions.historyTime")} - 
						${convertTimestampToDate(sessionLogRecord?.result?.value?.time?.v).toISOString()}`;
			return;
		}
		if (sessionLogRecord?.result?.value?.nothing) {
			this.logs = `${translate().t("sessions.historyFunction")} - 
				${translate().t("sessions.historyResult")}: 
				${translate().t("sessions.historyNoOutput")}`;
			return;
		}

		const functionResponse = sessionLogRecord?.result?.value?.struct?.fields?.body?.string?.v || "";
		const functionName = sessionLogRecord?.result?.value?.struct?.ctor?.string?.v || "";

		if (!functionName && !functionResponse) {
			this.logs = undefined;
			return;
		}
		this.logs = `${translate().t("sessions.historyFunction")} - 
			${translate().t("sessions.historyResult")}: 
			${functionName} - ${functionResponse}`;
	}

	private handleFuncCall(logRecord: ProtoSessionLogRecord) {
		this.type = SessionLogRecordType.callSpec;
		const sessionLogRecord = logRecord[this.type];

		const functionName = sessionLogRecord?.function?.function?.name || "";
		const args = (sessionLogRecord?.args || [])
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

	isFinished(): boolean {
		return (
			this.state === SessionStateType.error ||
			this.state === SessionStateType.completed ||
			this.state === SessionStateType.stopped
		);
	}

	getStateName(): string | undefined {
		return this.state;
	}

	containLogs(): boolean {
		return !!(this.logs && this.logs.length);
	}

	getLogs(): string | undefined {
		return this.logs;
	}
}
