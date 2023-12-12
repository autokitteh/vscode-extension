import React, { ReactNode } from "react";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";

interface AKButtonProps {
	children: ReactNode;
	classes?: string;
}

export const AKButton = ({ children, classes }: AKButtonProps) => {
	return <VSCodeButton className={classes}>{children}</VSCodeButton>;
};
