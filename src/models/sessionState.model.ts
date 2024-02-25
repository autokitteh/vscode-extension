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
	dateTime?: Date;

	constructor(record: ProtoSessionHistoryState) {
		let recordDataCase = get(record, "data.case", SessionStateType.unknown) as SessionStateType;
		if (get(record, "data.case") === "state") {
			recordDataCase = get(record, "data.value.states.case", SessionStateType.unknown) as SessionStateType;
		}
		if (!recordDataCase || !(recordDataCase in SessionStateType)) {
			LoggerService.error("SessionState", translate().t("errors.unexpectedSessionStateType"));
			this.type = SessionStateType.unknown;
			return;
		}

		switch (recordDataCase) {
			case SessionStateType.callAttemptStart:
				this.type = SessionStateType.callAttemptStart;
				this.dateTime = convertTimestampToDate(get(record, "data.value.startedAt") as unknown as ProtoTimestamp);
				break;
			case SessionStateType.callAttemptComplete:
				this.handleCallAttemptComplete(record);
				break;
			case SessionStateType.callSpec:
				this.handleFuncCall(record);
				break;
			case SessionStateType.print:
				this.type = SessionStateType.print;
				this.logs = ["Print: " + get(record, "data.value", "")];
				break;
			default:
				this.handleDefaultCase(record);
		}

		if (this.dateTime === undefined) {
			this.setDateTime(record, recordDataCase);
		}
		this.setErrorAndCallstack(record);
	}

	private handleCallAttemptComplete(record: ProtoSessionHistoryState) {
		this.type = SessionStateType.callAttemptComplete;
		let functionResponse = get(record, "data.value.result.result.value.type.value.v", "");
		const functionName = get(record, "data.value.result.result.value.type.case", "") as string;
		if (functionName === "time") {
			functionResponse = convertTimestampToDate(functionResponse as unknown as ProtoTimestamp).toISOString();
		}
		this.logs = [`Result: ${functionName} - ${functionResponse}`];
	}

	private handleFuncCall(record: ProtoSessionHistoryState) {
		this.type = SessionStateType.callSpec;
		const functionName = get(record, "data.value.function.type.value.name", "");
		const args = get(record, "data.value.args", [])
			.map((arg: any) => arg.type.value.v)
			.join(", ");
		this.logs = [`Function: ${functionName}(${args})`];
	}

	private handleDefaultCase(record: ProtoSessionHistoryState) {
		const stateCase = get(record, "data.value.states.case");
		if (!stateCase || !(stateCase in SessionStateType)) {
			this.type = SessionStateType.unknown;
		} else if (stateCase) {
			this.type = stateCase as SessionStateType;
			this.logs = get(record, "data.value.states.value.prints", []);
		}
	}

	private setDateTime(record: ProtoSessionHistoryState, recordDataCase: string) {
		try {
			let dateTimeStamp: ProtoTimestamp;
			if (["callSpec", "callAttemptComplete", "print"].includes(recordDataCase)) {
				dateTimeStamp = get(record, "t") as unknown as ProtoTimestamp;
			} else {
				dateTimeStamp = get(record, "data.value.t") as unknown as ProtoTimestamp;
			}

			this.dateTime = convertTimestampToDate(dateTimeStamp);
		} catch (error) {
			console.error("Error setting dateTime:", error);
		}
	}

	private setErrorAndCallstack(record: ProtoSessionHistoryState) {
		this.error = get(
			record,
			"data.value.states.value.error.message",
			translate().t("errors.sessionLogMissingOnErrorType")
		);
		this.callstackTrace = get(record, "data.value.states.value.error.callstack", []) as Callstack[];
		this.call = get(record, "data.value.states.call", {});
		this.exports = get(record, "data.value.states.value.exports", new Map());
		this.returnValue = get(record, "data.value.states.value.returnValue", {});
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
