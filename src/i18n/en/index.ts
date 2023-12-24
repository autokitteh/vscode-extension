import errors from "@i18n/en/errors.i18n.json";
import general from "@i18n/en/general.i18n.json";
import messages from "@i18n/en/messages.i18n.json";
import projects from "@i18n/en/projects.i18n.json";
import reactAppDeployments from "@i18n/en/reactApp/deployments.reactApp.i18n.json";
import reactAppErrors from "@i18n/en/reactApp/errors.reactApp.i18n.json";
import reactAppGeneral from "@i18n/en/reactApp/general.reactApp.i18n.json";
import walkthrough from "@i18n/en/walkthrough.i18n.json";

export const english = {
	errors,
	projects,
	messages,
	general,
	walkthrough,
	reactApp: {
		general: reactAppGeneral,
		errors: reactAppErrors,
		deployments: reactAppDeployments,
	},
};
