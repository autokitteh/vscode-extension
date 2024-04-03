import React, { ReactNode } from "react";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";

interface ButtonProps {
	children: ReactNode;
	classes?: string;
	onClick?: () => void;
	title?: string;
	disabled?: boolean;
}

export const Button = ({ children, classes, onClick, title, disabled }: ButtonProps) => {
	return (
		<VSCodeButton className={classes} onClick={onClick} title={title} disabled={disabled}>
			{children}
		</VSCodeButton>
	);
};
