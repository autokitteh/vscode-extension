import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import React, { MouseEvent, ReactNode } from "react";

type ButtonProps = {
	children: ReactNode;
	classes?: string;
	disabled?: boolean;
	onClick: (event?: MouseEvent<HTMLElement>) => void;
	title?: string;
};

export const Button = ({ children, classes, disabled, onClick, title }: ButtonProps) => {
	return (
		<VSCodeButton className={classes} disabled={disabled} onClick={onClick} title={title}>
			{children}
		</VSCodeButton>
	);
};
