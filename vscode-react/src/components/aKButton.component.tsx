import React, { ReactNode } from "react";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";

interface AKButtonProps {
	children: ReactNode;
	classes?: string;
	onClick?: () => void;
	title?: string;
	disabled?: boolean;
}

export const AKButton = ({ children, classes, onClick, title, disabled }: AKButtonProps) => {
	return (
		<VSCodeButton className={classes} onClick={onClick} title={title} disabled={disabled}>
			{children}
		</VSCodeButton>
	);
};
