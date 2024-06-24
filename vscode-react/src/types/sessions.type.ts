import { RefObject } from "react";
import { SessionState } from "@react-enums";
import { Session } from "@type/models";

export type SessionsTableRowProps = {
	sessions: Session[];
	sessionActions: {
		startSession: (session: Session) => void;
		stopSession: (session: Session) => void;
		displayInputsModal: (sessionInputs: string) => void;
		displaySessionDeletePopper: (event: React.MouseEvent<HTMLDivElement>, session: Session) => void;
		isRunning: (sessionState: SessionState) => boolean;
		isStopped: (sessionState: SessionState) => boolean;
		getStopSessionClass: (sessionState: SessionState) => string;
		isLastDeployment: (deploymentId: string) => boolean;
	};
	selectedSessionId: string;
	displaySessionLogs: (sessionId: string) => void;
	modalName: string;
	hidePopper: () => void;
	deleteSessionConfirmed: () => void;
	deleteSessionDismissed: () => void;
	deleteSessionPopperTranslations: {
		title: string;
		subtitle: string;
	};
	deletePopperElementRef: RefObject<HTMLDivElement>;
};
