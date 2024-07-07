import * as vscode from "vscode";

import { AK_FRONTEND_URL } from "@constants";

export const openAddConnectionsPage = () => {
	const integrationsURL = `${AK_FRONTEND_URL}/i/`;
	vscode.env.openExternal(vscode.Uri.parse(integrationsURL));
};
