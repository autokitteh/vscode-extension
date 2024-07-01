import { SessionStateType as ProtoSessionStateType } from "@ak-proto-ts/sessions/v1/session_pb";
import { SessionStateType } from "@enums";
import { DeploymentSessionsStats } from "@type/models";

export const sessionStateConverter = (sessionState: number): SessionStateType | undefined => {
	if (!(sessionState in ProtoSessionStateType)) {
		return;
	}
	const sessionStateType = ProtoSessionStateType[sessionState].toLowerCase();
	return SessionStateType[sessionStateType as keyof typeof SessionStateType];
};
export const reverseSessionStateConverter = (sessionState: SessionStateType | undefined): number | undefined => {
	if (!sessionState) {
		return;
	}
	if (!(sessionState in SessionStateType)) {
		return;
	}
	const sessionStateType = ProtoSessionStateType[sessionState.toUpperCase() as keyof typeof ProtoSessionStateType];
	return sessionStateType;
};
export const sessionStateStatsConverter = (
	sessionsStats: { state: number; count: number }[]
): DeploymentSessionsStats[] => {
	const sessionStats: DeploymentSessionsStats[] = [];
	let runningCount = 0;
	let createdCount = 0;

	sessionsStats.forEach((sessionStat) => {
		const state = sessionStateConverter(sessionStat.state);
		if (state === SessionStateType.running) {
			runningCount = sessionStat.count;
		} else if (state === SessionStateType.created) {
			createdCount = sessionStat.count;
		} else if (state !== undefined) {
			sessionStats.push({
				state,
				count: sessionStat.count,
			});
		}
	});

	if (runningCount > 0 || createdCount > 0) {
		sessionStats.push({
			state: SessionStateType.running,
			count: runningCount + createdCount,
		});
	}

	return sessionStats;
};
