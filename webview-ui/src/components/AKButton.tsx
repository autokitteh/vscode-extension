import React, { ReactNode } from "react";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";

interface AKButtonProps {
	children: ReactNode;
	classes?: string;
	onClick: () => void;
}

export const AKButton = ({ children, classes, onClick }: AKButtonProps) => {
	return (
		<VSCodeButton className={classes} onClick={onClick}>
			{children}
		</VSCodeButton>
	);
};
