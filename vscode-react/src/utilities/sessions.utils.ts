// src/utils/sessionUtils.ts

import { MessageType } from "@enums";
import { SessionState } from "@react-enums";
import { sendMessage } from "@react-utilities";
import { Deployment, Session } from "@type/models";

interface SessionActions {
	startSession: (session: Session) => void;
	stopSession: (session: Session) => void;
	isRunning: (sessionState: SessionState) => boolean;
	getStopSessionClass: (sessionState: SessionState) => string;
	isLastDeployment: (deploymentId: string) => boolean;
}

export function getSessionActions(lastDeployment: Deployment): SessionActions {
	return {
		startSession: (session: Session) => {
			const startSessionArgs = {
				sessionId: session.sessionId,
				buildId: lastDeployment?.buildId,
				deploymentId: lastDeployment?.deploymentId,
				entrypoint: session.entrypoint,
			};

			sendMessage(MessageType.startSession, startSessionArgs);
		},
		stopSession: (session: Session) => {
			if (session.state !== SessionState.RUNNING) {
				return;
			}
			sendMessage(MessageType.stopSession, session.sessionId);
		},
		isRunning: (sessionState: SessionState) => {
			return sessionState === SessionState.RUNNING;
		},
		getStopSessionClass: (sessionState: SessionState) => {
			return sessionState === SessionState.RUNNING ? "text-red-500 cursor-pointer" : "text-gray-500 cursor-not-allowed";
		},
		isLastDeployment: (deploymentId: string) => {
			return deploymentId === lastDeployment?.deploymentId;
		},
	};
}
