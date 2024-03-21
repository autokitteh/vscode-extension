import { MessageType, ProjectIntervalTypes } from "@enums";
import { IProjectView } from "@interfaces";
import { DeploymentSectionViewModel, SessionSectionViewModel } from "@models";
import { Deployment, Session } from "@type/models";

export const selectDeploymentUpdateView = (
	view: IProjectView,
	deploymentId: string,
	startInterval: (type: ProjectIntervalTypes, callback: () => void, interval: number) => void,
	displaySessionsHistory: (sessionId: string) => Promise<void>,
	sessionsLogRefreshRate: number,
	sessions?: Session[]
) => {
	const sessionsViewObject: SessionSectionViewModel = {
		sessions,
		totalSessions: sessions?.length || 0,
	};

	view.update({
		type: MessageType.setSessionsSection,
		payload: sessionsViewObject,
	});

	view.update({
		type: MessageType.selectDeployment,
		payload: deploymentId,
	});

	if (sessions?.length) {
		view.update({
			type: MessageType.selectSession,
			payload: sessions[0].sessionId,
		});

		startInterval(
			ProjectIntervalTypes.sessionHistory,
			() => displaySessionsHistory(sessions![0].sessionId!),
			sessionsLogRefreshRate
		);
	}
};

export const displayDeploymentsUpdateView = (view: IProjectView, deployments?: Deployment[], sessions?: Session[]) => {
	const deploymentsViewObject: DeploymentSectionViewModel = {
		deployments,
		totalDeployments: deployments?.length || 0,
	};
	view.update({
		type: MessageType.setDeployments,
		payload: deploymentsViewObject,
	});

	const sessionsViewObject: SessionSectionViewModel = {
		sessions: sessions,
		totalSessions: sessions?.length || 0,
	};

	view.update({ type: MessageType.setSessionsSection, payload: sessionsViewObject });
};
