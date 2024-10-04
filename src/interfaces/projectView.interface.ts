import { UIStartSessionArgsType } from "@type";
import { Callback } from "@type/interfaces";

export interface ProjectViewDelegate {
	onClose?: Callback;
	onBlur?: Callback;
	onFocus?: Callback;
	build: Callback;
	onClickSetResourcesDirectory: Callback;
	run: Callback;
	selectDeployment?: Callback<string>;
	displaySessionLogsAndStop?: Callback<string>;
	activateDeployment?: Callback<string>;
	deactivateDeployment?: Callback<string>;
	startSession?: Callback<UIStartSessionArgsType>;
	deleteDeployment?: Callback<string>;
	deleteSession?: Callback<string>;
	displayErrorWithoutActionButton?: Callback<string>;
	stopSession?: Callback<string>;
	copyProjectPath?: Callback<string>;
	openProjectResourcesDirectory?: Callback<string>;
	deleteProject?: Callback;
	setProjectResourcesDirectory?: Callback<string>;
	setSessionsStateFilter?: Callback<string>;
	loadInitialDataOnceViewReady: Callback;
	loadMoreSessions?: Callback;
	tryToReenable?: Callback;
	refreshUI?: Callback;
	connections: ConnectionsViewDelegate;
}
export interface ConnectionsViewDelegate {
	openConnectionInitURL?: Callback<{
		connectionName: string;
		connectionId: string;
	}>;
	openConnectionsModal?: Callback;
	fetchConnections?: Callback;
	dispose?: () => void;
}

export interface IProjectView {
	show(projectName: string): void;
	reveal(projectName: string): void;
	update(data: any): void;
	dispose(): void;
	delegate?: ProjectViewDelegate;
}
