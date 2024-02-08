import { AK_FRONTEND_URL } from "@constants";
import * as vscode from "vscode";

export const openAddConnectionsPage = () => {
	const integrationsURL = `${AK_FRONTEND_URL}/i/`;
	vscode.env.openExternal(vscode.Uri.parse(integrationsURL));
};
