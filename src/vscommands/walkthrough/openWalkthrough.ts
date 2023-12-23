import { EXT_PUBLISHER, vsCommands } from "@constants";
import { commands } from "vscode";

export const openWalkthrough = () => {
	commands.executeCommand(
		vsCommands.openWalkthrough,
		`${EXT_PUBLISHER}.vscode-v2#autokitteh.walkthrough`,
		false
	);
};
