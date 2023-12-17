import { EXT_PUBLISHER } from "@constants";
import { commands } from "vscode";

export const openWalkthrough = () => {
	commands.executeCommand(
		`workbench.action.openWalkthrough`,
		`${EXT_PUBLISHER}.vscode-v2#autokitteh.walkthrough`,
		false
	);
};
