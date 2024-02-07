import { ADD_CONNECTIONS_URL } from "@constants";
import * as vscode from "vscode";

export const openAddConnectionsPage = () => {
	vscode.env.openExternal(vscode.Uri.parse(ADD_CONNECTIONS_URL));
};
