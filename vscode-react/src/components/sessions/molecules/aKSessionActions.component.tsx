import { useCallback } from "react";
import { translate } from "@i18n";
import { SessionState } from "@react-enums";
import { Session } from "@type/models";

export const SessionActions = ({
	session,
	startSession,
	stopSession,
	displayInputsModal,
	displaySessionDeletePopper,
	isLastDeployment,
	getStopSessionClass,
	isRunning,
}: {
	session: Session;
	startSession: (session: Session) => void;
	stopSession: (session: Session) => void;
	displayInputsModal: (sessionInputs: string) => void;
	displaySessionDeletePopper: (event: React.MouseEvent<HTMLDivElement>, session: Session) => void;
	isRunning: (sessionState: SessionState) => boolean;
	getStopSessionClass: (sessionState: SessionState) => string;
	isLastDeployment: (deploymentId: string) => boolean;
}) => {
	const onStart = useCallback(() => startSession(session), [session]);
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
					title={translate().t("reactApp.sessions.startSession")}
					onClick={onStart}
				></div>
			)}
			<div
				className={`codicon codicon-debug-stop mr-2 ${getStopSessionClass(session.state)}`}
				title={translate().t("reactApp.sessions.stopSession")}
				onClick={onStop}
			></div>
			{isLastDeployment(session.deploymentId) && (
				<div
					className="codicon codicon-symbol-namespace mr-2 cursor-pointer"
					title={translate().t("reactApp.sessions.showSessionProps")}
					onClick={onDisplayInputs}
				></div>
			)}
			<div
				className={`codicon codicon-trash mr-2 z-20 ${
					isRunning(session.state) ? "cursor-not-allowed" : "cursor-pointer"
				}`}
				title={
					isRunning(session.state)
						? translate().t("reactApp.sessions.deleteSessionDisabled")
						: translate().t("reactApp.sessions.delete")
				}
				onClick={(event) => displaySessionDeletePopper(event, session)}
			></div>
		</>
	);
};
