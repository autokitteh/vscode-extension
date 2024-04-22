import React, { ReactNode } from "react";
import { cn } from "@react-utilities";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";

interface AKButtonProps {
	children: ReactNode;
	classes?: string;
	onClick?: () => void;
	title?: string;
	disabled?: boolean;
}

export const AKButton = ({ children, classes, onClick, title, disabled }: AKButtonProps) => {
	const buttonClass = cn("font-mono", classes);
	return (
		<VSCodeButton className={buttonClass} onClick={onClick} title={title} disabled={disabled}>
			{children}
		</VSCodeButton>
	);
};
