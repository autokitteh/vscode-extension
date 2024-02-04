import { SessionStateType } from "@enums";
import { translate } from "@i18n/index";
import { LoggerService } from "@services";
import { ProtoSessionHistoryState } from "@type/models";
import { get } from "lodash";

type Callstack = {
	location: {
		col: number;
		row: number;
		name: string;
		path: string;
	};
};

class CreatedState {
	callstackTrace: Callstack[];

	constructor(callstackTrace: Callstack[] = []) {
		this.callstackTrace = callstackTrace;
	}
}

class RunningState {
	logs: string[];
	call?: object;
	callstackTrace: Callstack[];

	constructor(prints: string[], call?: object, callstackTrace: Callstack[] = []) {
		this.logs = prints;
		this.call = call;
		this.callstackTrace = callstackTrace;
	}
}

class ErrorState {
	error: string;
	callstackTrace: Callstack[];

	constructor(error: string, callstackTrace: Callstack[] = []) {
		this.error = error;
		this.callstackTrace = callstackTrace;
	}
}

class CompletedState {
	logs: string[];
	exports: Map<string, object>;
	returnValue: object;
	callstackTrace: Callstack[];

	constructor(prints: string[], exports: Map<string, object>, returnValue: object, callstackTrace: Callstack[] = []) {
		this.logs = prints;
		this.exports = exports;
		this.returnValue = returnValue;
		this.callstackTrace = callstackTrace;
	}
}

export class SessionState {
	state: CreatedState | RunningState | ErrorState | CompletedState | undefined;

	constructor(state: ProtoSessionHistoryState) {
		const stateCase = get(state, "states.case");
		let prints, call, exports, returnValue;
		const callstackTrace = get(state, "states.value.error.callstack", []) as Callstack[];

		if (!stateCase) {
			this.state = new ErrorState(translate().t("errors.missingSessionStateType"), []);

			return;
		}
		switch (stateCase) {
			case SessionStateType.created:
				this.state = new CreatedState(callstackTrace);
				break;
			case SessionStateType.running:
				prints = get(state, "states.prints", []);
				call = get(state, "states.call", {});
				this.state = new RunningState(prints, call, callstackTrace);
				break;
			case SessionStateType.error:
				const errorMessage = get(
					state,
					"states.value.error.message",
					translate().t("errors.sessionLogMissingOnErrorType")
				);
				this.state = new ErrorState(errorMessage, callstackTrace);
				break;
			case SessionStateType.completed:
				prints = get(state, "states.value.prints", []);
				exports = get(state, "states.value.exports", new Map());
				returnValue = get(state, "states.value.returnValue", {});
				this.state = new CompletedState(prints, exports, returnValue, callstackTrace);
				break;
			default:
				LoggerService.error("SessionState", translate().t("errors.unexpectedSessionStateType"));
		}
	}

	getError(): string {
		if (this.state instanceof ErrorState) {
			return this.state.error;
		}
		return translate().t("errors.sessionLogMissingErrorMessage");
	}

	getCallstack(): Callstack[] {
		return this.state?.callstackTrace || [];
	}

	isError(): this is { state: ErrorState } {
		return this.state instanceof ErrorState;
	}

	containLogs(): boolean {
		return (this.state instanceof RunningState || this.state instanceof CompletedState) && this.state.logs.length > 0;
	}

	getLogs(): string[] {
		if (this.containLogs()) {
			//@ts-ignore
			return this.state.logs;
		}
		return [];
	}
}
