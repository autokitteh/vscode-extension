import React, { ReactNode, MouseEvent } from "react";

import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";

type ButtonProps = {
	children: ReactNode;
	classes?: string;
	onClick: (event?: MouseEvent<HTMLElement>) => void;
	title?: string;
	disabled?: boolean;
};

export const Button = ({ children, classes, onClick, title, disabled }: ButtonProps) => {
	return (
		<VSCodeButton className={classes} onClick={onClick} title={title} disabled={disabled}>
			{children}
		</VSCodeButton>
	);
};
