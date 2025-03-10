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
	setOutputs = "SET_OUTPUTS",
	deleteDeployment = "DELETE_DEPLOYMENT",
	deploymentDeleted = "DEPLOYMENT_DELETED",
	deleteSession = "DELETE_SESSION",
	displayErrorWithoutActionButton = "DISPLAY_ERROR_WITHOUT_ACTION_BUTTON",
	stopSession = "STOP_SESSION",
	copyProjectPath = "COPY_PROJECT_PATH",
	openProjectResourcesDirectory = "OPEN_PROJECT_RESOURCES_DIRECTORY",
	setProjectResourcesDirectory = "SET_PROJECT_RESOURCES_DIRECTORY",
	deleteProject = "DELETE_PROJECT",
	setSessionsStateFilter = "SET_SESSIONS_STATE_FILTER",
	loadInitialDataOnceViewReady = "LOAD_INITIAL_DATA_ONCE_VIEW_READY",
	startLoader = "START_LOADER",
	stopLoader = "STOP_LOADER",
	loadMoreSessions = "LOAD_MORE_SESSIONS",
	loadMoreSessionsOutputs = "LOAD_MORE_SESSIONS_OUTPUTS",
	setRetryCountdown = "SET_RETRY_COUNTDOWN",
	tryToReconnect = "TRY_TO_RECONNECT",
	setConnections = "SET_CONNECTIONS",
	refreshUI = "REFRESH_UI",
	openTriggersWebUI = "OPEN_TRIGGERS_WEB_UI",
	openConnectionsWebUI = "OPEN_CONNECTIONS_WEB_UI",
}
