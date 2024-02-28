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

	constructor(session: ProtoSessionHistoryState) {
		let sessionState = get(session, "data.case", SessionStateType.unknown) as SessionStateType;
		if (get(session, "data.case") === "state") {
			sessionState = get(session, "data.value.states.case", SessionStateType.unknown) as SessionStateType;
		}
		if (!sessionState || !(sessionState in SessionStateType)) {
			LoggerService.error("SessionState", translate().t("errors.unexpectedSessionStateType"));
			this.type = SessionStateType.unknown;
			return;
		}

		switch (sessionState) {
			case SessionStateType.callAttemptStart:
				this.type = SessionStateType.callAttemptStart;
				this.dateTime = convertTimestampToDate(get(session, "data.value.startedAt") as unknown as ProtoTimestamp);
				break;
			case SessionStateType.callAttemptComplete:
				this.handleCallAttemptComplete(session);
				break;
			case SessionStateType.callSpec:
				this.handleFuncCall(session);
				break;
			case SessionStateType.print:
				this.type = SessionStateType.print;
				this.logs = ["Print: " + get(session, "data.value", "")];
				break;
			default:
				this.handleDefaultCase(session);
		}

		if (this.dateTime === undefined) {
			this.setDateTime(session, sessionState);
		}
		this.setErrorAndCallstack(session);
	}

	private handleCallAttemptComplete(session: ProtoSessionHistoryState) {
		this.type = SessionStateType.callAttemptComplete;
		let functionResponse = get(session, "data.value.result.result.value.type.value.v", "");
		const functionName = get(session, "data.value.result.result.value.type.case", "") as string;
		if (functionName === "time") {
			functionResponse = convertTimestampToDate(functionResponse as unknown as ProtoTimestamp).toISOString();
		}
		this.logs = [`Result: ${functionName} - ${functionResponse}`];
	}

	private handleFuncCall(session: ProtoSessionHistoryState) {
		this.type = SessionStateType.callSpec;
		const functionName = get(session, "data.value.function.type.value.name", "");
		const args = get(session, "data.value.args", [])
			.map((arg: any) => arg.type.value.v)
			.join(", ");
		this.logs = [`Function: ${functionName}(${args})`];
	}

	private handleDefaultCase(session: ProtoSessionHistoryState) {
		const stateCase = get(session, "data.value.states.case");
		if (!stateCase || !(stateCase in SessionStateType)) {
			this.type = SessionStateType.unknown;
		} else if (stateCase) {
			this.type = stateCase as SessionStateType;
			this.logs = get(session, "data.value.states.value.prints", []);
		}
	}

	private setDateTime(session: ProtoSessionHistoryState, sessionState: string) {
		try {
			let dateTimeStamp: ProtoTimestamp;
			if (["callSpec", "callAttemptComplete", "print"].includes(sessionState)) {
				dateTimeStamp = get(session, "t") as unknown as ProtoTimestamp;
			} else {
				dateTimeStamp = get(session, "data.value.t") as unknown as ProtoTimestamp;
			}

			this.dateTime = convertTimestampToDate(dateTimeStamp);
		} catch (error) {
			console.error("Error setting dateTime:", error);
		}
	}

	private setErrorAndCallstack(session: ProtoSessionHistoryState) {
		this.error = get(
			session,
			"data.value.states.value.error.message",
			translate().t("errors.sessionLogMissingOnErrorType")
		);
		this.callstackTrace = get(session, "data.value.states.value.error.callstack", []) as Callstack[];
		this.call = get(session, "data.value.states.call", {});
		this.exports = get(session, "data.value.states.value.exports", new Map());
		this.returnValue = get(session, "data.value.states.value.returnValue", {});
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
