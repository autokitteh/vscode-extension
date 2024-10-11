import { translate } from "@i18n";
import { SessionState } from "@react-enums";
import { Session } from "@type/models";
import { useCallback } from "react";

export const SessionActions = ({
	displayInputsModal,
	displaySessionDeletePopper,
	getStopSessionClass,
	isLastDeployment,
	isRunning,
	isStopped,
	session,
	startSession,
	stopSession,
}: {
	displayInputsModal: (sessionInputs: string) => void;
	displaySessionDeletePopper: (event: React.MouseEvent<HTMLDivElement>, session: Session) => void;
	getStopSessionClass: (sessionState: SessionState) => string;
	isLastDeployment: (deploymentId: string) => boolean;
	isRunning: (sessionState: SessionState) => boolean;
	isStopped: (sessionState: SessionState) => boolean;
	session: Session;
	startSession: (session: Session) => void;
	stopSession: (session: Session) => void;
}) => {
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const onStart = useCallback(() => startSession(session), [session]);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const onStop = useCallback(() => stopSession(session), [session]);
	const onDisplayInputs = useCallback(() => {
		const sessionInputs = JSON.stringify(session.inputs, null, 2);
		displayInputsModal(sessionInputs);
	}, [session.inputs, displayInputsModal]);

	return (
		<>
			{isLastDeployment(session.deploymentId) && (
				<div
					className="codicon codicon-debug-rerun mr-2 cursor-pointer"
					onClick={onStart}
					title={translate().t("reactApp.sessions.startSession")}
				></div>
			)}
			<div
				className={`codicon codicon-debug-stop mr-2 ${getStopSessionClass(session.state)}`}
				onClick={onStop}
				title={translate().t("reactApp.sessions.stopSession")}
			></div>
			{isLastDeployment(session.deploymentId) && (
				<div
					className="codicon codicon-symbol-namespace mr-2 cursor-pointer"
					onClick={onDisplayInputs}
					title={translate().t("reactApp.sessions.showSessionProps")}
				></div>
			)}
			<div
				className={`codicon codicon-trash z-20 mr-2 ${
					isRunning(session.state) || isStopped(session.state) ? "cursor-not-allowed" : "cursor-pointer"
				}`}
				onClick={(event) => displaySessionDeletePopper(event, session)}
				title={
					isRunning(session.state) || isStopped(session.state)
						? translate().t("reactApp.sessions.deleteSessionDisabled")
						: translate().t("reactApp.sessions.delete")
				}
			></div>
		</>
	);
};
