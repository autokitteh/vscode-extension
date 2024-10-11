import { MessageType } from "@enums";
import { SessionState } from "@react-enums";
import { sendMessage } from "@react-utilities";
import { Deployment, Session } from "@type/models";

interface SessionActions {
	getStopSessionClass: (sessionState: SessionState) => string;
	isLastDeployment: (deploymentId: string) => boolean;
	isRunning: (sessionState: SessionState) => boolean;
	isStopped: (sessionState: SessionState) => boolean;
	startSession: (session: Session) => void;
	stopSession: (session: Session) => void;
}

export function getSessionActions(lastDeployment: Deployment): SessionActions {
	return {
		getStopSessionClass: (sessionState: SessionState) => {
			return sessionState === SessionState.RUNNING ? "text-red-500 cursor-pointer" : "text-gray-500 cursor-not-allowed";
		},
		isLastDeployment: (deploymentId: string) => {
			return deploymentId === lastDeployment?.deploymentId;
		},
		isRunning: (sessionState: SessionState) => {
			return sessionState === SessionState.RUNNING;
		},
		isStopped: (sessionState: SessionState) => {
			return sessionState === SessionState.STOPPED;
		},
		startSession: (session: Session) => {
			const startSessionArgs = {
				buildId: lastDeployment?.buildId,
				deploymentId: lastDeployment?.deploymentId,
				entrypoint: session.entrypoint,
				sessionId: session.sessionId,
			};

			sendMessage(MessageType.startSession, startSessionArgs);
		},
		stopSession: (session: Session) => {
			if (session.state !== SessionState.RUNNING) {
				return;
			}
			sendMessage(MessageType.stopSession, session.sessionId);
		},
	};
}
