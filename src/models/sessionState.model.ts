import { SessionStateType } from "@enums";
import { translate } from "@i18n/index";
import { LoggerService } from "@services";
import { Callstack, ProtoSessionHistoryState } from "@type/models";
import { ProtoTimestamp } from "@type/utilities";
import { convertTimestampToDate } from "@utilities";
import { get } from "lodash";

export class SessionState {
	type: SessionStateType = SessionStateType.unknown;
	callstackTrace: Callstack[] = [];
	logs?: string[];
	error?: string;
	call?: object;
	exports?: Map<string, object>;
	returnValue?: object;
	dateTime: Date;

	constructor(record: ProtoSessionHistoryState) {
		const stateCase = get(record, "data.value.states.case");
		const dateTimeStamp = get(record, "data.value.t") as unknown as ProtoTimestamp;
		this.dateTime = convertTimestampToDate(dateTimeStamp);

		if (!stateCase || !(stateCase in SessionStateType)) {
			LoggerService.error("SessionState", translate().t("errors.unexpectedSessionStateType"));
			this.type = SessionStateType.unknown;
			return;
		}

		this.callstackTrace = get(record, "data.value.states.value.error.callstack", []) as Callstack[];

		this.type = stateCase;
		this.logs = get(record, "data.value.states.value.prints", this.logs || []);
		this.call = get(record, "data.value.states.call", this.call || {});
		this.exports = get(record, "data.value.states.value.exports", this.exports || new Map());
		this.error = get(
			record,
			"data.value.states.value.error.message",
			this.error || translate().t("errors.sessionLogMissingOnErrorType")
		);
		this.returnValue = get(record, "data.value.states.value.returnValue", this.returnValue || {});
	}

	getError(): string {
		return this.error || translate().t("errors.sessionLogMissingErrorMessage");
	}

	getCallstack(): Callstack[] {
		return this.callstackTrace;
	}

	isError(): boolean {
		return this.type === SessionStateType.error;
	}

	containLogs(): boolean {
		return !!(this.logs && this.logs.length);
	}

	getLogs(): string[] {
		return this.logs || [];
	}
}
