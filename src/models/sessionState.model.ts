import { SessionStateType } from "@enums";
import { translate } from "@i18n/index";
import { LoggerService } from "@services";
import { Callstack, ProtoSessionHistoryState } from "@type/models";
import { convertTimestampToDate } from "@utilities";
import { get } from "lodash";

export class SessionState {
	type: SessionStateType = SessionStateType.unknown;
	callstackTrace: Callstack[] = [];
	logs?: string[];
	error?: string;
	call?: object;
	dateTime?: Date;

	constructor(session: ProtoSessionHistoryState) {
		const stateTypeMapping: Record<string, SessionStateType> = {
			callSpec: SessionStateType.callSpec,
			callAttemptComplete: SessionStateType.callAttemptComplete,
			callAttemptStart: SessionStateType.callAttemptStart,
			error: SessionStateType.error,
			print: SessionStateType.print,
		};

		const state = get(session, "state") ?? session;

		if (Object.keys(state).length === 0 && !get(session, "print")) {
			LoggerService.error("SessionState", translate().t("errors.unexpectedSessionStateType"));
			return;
		}

		const sessionState = Object.keys(stateTypeMapping).find((key) => key in state) ?? Object.keys(state)[0];

		const determinedStateType: SessionStateType = stateTypeMapping[sessionState] || SessionStateType.unknown;

		if (!Object.values(SessionStateType).includes(determinedStateType)) {
			LoggerService.error("SessionState", translate().t("errors.unexpectedSessionStateType"));
			return;
		}

		const unhandledSessionStates = ["created", "running", "error", "completed"];

		switch (sessionState) {
			case SessionStateType.callAttemptStart:
				this.type = SessionStateType.callAttemptStart;
				this.dateTime = convertTimestampToDate(get(session, `${this.type}.startedAt`));
				break;
			case SessionStateType.callAttemptComplete:
				this.handleCallAttemptComplete(session);
				break;
			case SessionStateType.callSpec:
				this.handleFuncCall(session);
				break;
			case SessionStateType.print:
				this.type = SessionStateType.print;
				this.logs = [`${translate().t("sessions.historyPrint")}: ${get(session, "print", "")}`];
				break;
			default:
				if (!unhandledSessionStates.includes(sessionState)) {
					throw new Error(translate().t("errors.unexpectedSessionStateType"));
				}
				this.handleDefaultCase(session);
		}

		if (this.dateTime === undefined) {
			this.setDateTime(session);
		}
		this.setErrorAndCallstack(session);
	}

	private handleDefaultCase(session: ProtoSessionHistoryState) {
		const stateCase = Object.keys(get(session, "state", {}))[0] as SessionStateType;
		if (!stateCase || !(stateCase in SessionStateType)) {
			this.type = SessionStateType.unknown;
		} else if (stateCase) {
			this.type = stateCase as SessionStateType;
			this.logs = get(session, "print", []);
		}
	}

	private handleCallAttemptComplete(session: ProtoSessionHistoryState) {
		this.type = SessionStateType.callAttemptComplete;
		let functionResponse = get(session, `${this.type}.result.value.struct.fields.body.string.v`, "");
		const functionName = get(session, `${this.type}.result.value.struct.ctor.string.v`, "") as string;
		if (functionName === "time") {
			functionResponse = convertTimestampToDate(functionResponse).toISOString();
		}
		if (functionName === "" && functionResponse === "") {
			this.logs = [];
			return;
		}
		this.logs = [`${translate().t("sessions.historyResult")}: ${functionName} - ${functionResponse}`];
	}

	private handleFuncCall(session: ProtoSessionHistoryState) {
		this.type = SessionStateType.callSpec;
		const functionName = get(session, `[${this.type}].function.function.name`, "");
		const args = get(session, `[${this.type}].args`, [])
			.map((arg: any) => get(arg, "string.v"))
			.join(", ")
			.replace(/, ([^,]*)$/, "");
		this.logs = [`${translate().t("sessions.historyFunction")}: ${functionName}(${args})`];
	}

	private setDateTime(session: ProtoSessionHistoryState) {
		try {
			this.dateTime = convertTimestampToDate(get(session, "data.value.t"));
		} catch (error) {}
	}

	private setErrorAndCallstack(session: ProtoSessionHistoryState) {
		this.error = get(session, "state.error.error.message", translate().t("errors.sessionLogMissingOnErrorType"));
		this.callstackTrace = get(session, "state.error.error.callstack", []) as Callstack[];
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
