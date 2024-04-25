export enum MessageType {
	setDeployments = "SET_DEPLOYMENTS",
	setProjectName = "SET_PROJECT_NAME",
	setResourcesDir = "SET_RESOURCES_DIR_STATE",
	setTheme = "SET_THEME",
	runProject = "RUN_PROJECT",
	onClickSetResourcesDirectory = "ON_CLICK_SET_RESOURCES_DIRECTORY",
	buildProject = "BUILD_PROJECT",
	setSessionsSection = "SET_SESSIONS_SECTION",
	selectDeployment = "SELECT_DEPLOYMENT",
	selectSession = "SELECT_SESSION",
	displaySessionLogsAndStop = "DISPLAY_SESSION_LOGS_AND_STOP",
	deactivateDeployment = "DEACTIVATE_DEPLOYMENT",
	activateDeployment = "ACTIVATE_DEPLOYMENT",
	startSession = "START_SESSION",
	setEntrypoints = "SET_ENTRYPOINTS",
	deleteDeployment = "DELETE_DEPLOYMENT",
	deploymentDeleted = "DEPLOYMENT_DELETED",
	deploymentDeletedResponse = "DEPLOYMENT_DELETED_RESPONSE",
	deleteSession = "DELETE_SESSION",
	deleteSessionResponse = "DELETE_SESSION_RESPONSE",
	displayErrorWithoutActionButton = "DISPLAY_ERROR_WITHOUT_ACTION_BUTTON",
	stopSession = "STOP_SESSION",
	copyProjectPath = "COPY_PROJECT_PATH",
	openProjectResourcesDirectory = "OPEN_PROJECT_RESOURCES_DIRECTORY",
	setProjectResourcesDirectory = "SET_PROJECT_RESOURCES_DIRECTORY",
	deleteProject = "DELETE_PROJECT",
	setSessionsStateFilter = "SET_SESSIONS_STATE_FILTER",
	loadInitialDataOnceViewReady = "LOAD_INITIAL_DATA_ONCE_VIEW_READY",
	loadMoreSessions = "LOAD_MORE_SESSIONS",
}
