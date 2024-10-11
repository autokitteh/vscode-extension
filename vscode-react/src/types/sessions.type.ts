import { SessionState } from "@react-enums";
import { Session } from "@type/models";
import { RefObject } from "react";

export type SessionsTableRowProps = {
	deletePopperElementRef: RefObject<HTMLDivElement>;
	deleteSessionConfirmed: () => void;
	deleteSessionDismissed: () => void;
	deleteSessionPopperTranslations: {
		subtitle: string;
		title: string;
	};
	displaySessionLogs: (sessionId: string) => void;
	hidePopper: () => void;
	modalName: string;
	selectedSessionId: string;
	sessionActions: {
		displayInputsModal: (sessionInputs: string) => void;
		displaySessionDeletePopper: (event: React.MouseEvent<HTMLDivElement>, session: Session) => void;
		getStopSessionClass: (sessionState: SessionState) => string;
		isLastDeployment: (deploymentId: string) => boolean;
		isRunning: (sessionState: SessionState) => boolean;
		isStopped: (sessionState: SessionState) => boolean;
		startSession: (session: Session) => void;
		stopSession: (session: Session) => void;
	};
	sessions: Session[];
};
