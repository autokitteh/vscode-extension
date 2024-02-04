import { SessionStateType } from "@enums";
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
		this.error = get(state, "states.value.error.message", translate().t("errors.sessionLogMissingOnErrorType"));
		this.returnValue = get(state, "states.value.returnValue", {});
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
