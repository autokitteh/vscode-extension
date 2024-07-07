import { commands } from "vscode";

import { EXT_PUBLISHER, vsCommands } from "@constants";

export const openWalkthrough = () => {
	commands.executeCommand(vsCommands.openWalkthrough, `${EXT_PUBLISHER}.autokitteh#autokitteh.walkthrough`, false);
};
