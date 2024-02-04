import { SessionStateType } from "@enums/sessionStates.enum";
import { translate } from "@i18n/index";
import { LoggerService } from "@services";
import { Callstack, ProtoSessionHistoryState } from "@type/models";
import { get } from "lodash";

export class SessionState {
	type: SessionStateType;
	callstackTrace: Callstack[] = [];
	logs?: string[];
	error?: string;
	call?: object;
	exports?: Map<string, object>;
	returnValue?: object;

	constructor(state: ProtoSessionHistoryState) {
		const stateCase = get(state, "states.case");
		if (!stateCase || !(stateCase in SessionStateType)) {
			LoggerService.error("SessionState", translate().t("errors.unexpectedSessionStateType"));
			this.type = SessionStateType.unknown;
			return;
		}

		const callstackTrace = get(state, "states.value.error.callstack", []) as Callstack[];

		this.callstackTrace = callstackTrace;

		this.type = stateCase;
		this.logs = get(state, "states.prints", []);
		this.call = get(state, "states.call", {});
		this.exports = get(state, "states.value.exports", new Map());

		if (stateCase === SessionStateType.error) {
			this.error = get(state, "states.value.error.message", translate().t("errors.sessionLogMissingOnErrorType"));
		}
		if (stateCase === SessionStateType.completed) {
			this.returnValue = get(state, "states.value.returnValue", {});
		}
	}

	getError(): string {
		if (this.type === SessionStateType.error && this.error) {
			return this.error;
		}
		return translate().t("errors.sessionLogMissingErrorMessage");
	}

	getCallstack(): Callstack[] {
		return this.callstackTrace;
	}

	isError(): boolean {
		return this.type === SessionStateType.error;
	}

	containLogs(): boolean {
		return (
			(this.type === SessionStateType.running || this.type === SessionStateType.completed) &&
			!!this.logs &&
			this.logs.length > 0
		);
	}

	getLogs(): string[] {
		if (this.containLogs() && this.logs) {
			return this.logs;
		}
		return [];
	}
}
