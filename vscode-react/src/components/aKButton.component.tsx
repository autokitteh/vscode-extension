import React, { ReactNode } from "react";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";

interface AKButtonProps {
	children: ReactNode;
	classes?: string;
	onClick?: () => void;
	title?: string;
	disabled?: boolean;
	ref?: React.RefObject<any>;
}

export const AKButton = ({ children, classes, onClick, title, disabled, ref }: AKButtonProps) => {
	return (
		<VSCodeButton className={classes} onClick={onClick} title={title} disabled={disabled} ref={ref}>
			{children}
		</VSCodeButton>
	);
};
