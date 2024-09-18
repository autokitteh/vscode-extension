import connections from "@i18n/en/connections.i18n.json";
import deployments from "@i18n/en/deployments.i18n.json";
import errors from "@i18n/en/errors.i18n.json";
import general from "@i18n/en/general.i18n.json";
import manifest from "@i18n/en/manifest.i18n.json";
import messages from "@i18n/en/messages.i18n.json";
import projects from "@i18n/en/projects.i18n.json";
import reactAppConnections from "@i18n/en/reactApp/connections.reactApp.i18n.json";
import reactAppDeployments from "@i18n/en/reactApp/deployments.reactApp.i18n.json";
import reactAppGeneral from "@i18n/en/reactApp/general.reactApp.i18n.json";
import reactAppSessions from "@i18n/en/reactApp/sessions.reactApp.i18n.json";
import reactAppSettings from "@i18n/en/reactApp/settings.reactApp.i18n.json";
import resources from "@i18n/en/resources.i18n.json";
import sessions from "@i18n/en/sessions.i18n.json";
import token from "@i18n/en/token.i18n.json";
import walkthrough from "@i18n/en/walkthrough.i18n.json";

export const english = {
	connections,
	errors,
	projects,
	messages,
	general,
	walkthrough,
	manifest,
	sessions,
	deployments,
	token,
	resources,
	reactApp: {
		general: reactAppGeneral,
		deployments: reactAppDeployments,
		sessions: reactAppSessions,
		settings: reactAppSettings,
		connections: reactAppConnections,
	},
};
