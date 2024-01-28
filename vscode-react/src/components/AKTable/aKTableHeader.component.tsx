import React, { ReactNode } from "react";
import clsx from "clsx";

interface AKTableHeaderProps {
	children: ReactNode;
	classes?: string;
}

export const AKTableHeader = ({ children, classes }: AKTableHeaderProps) => {
	const baseClass = "bg-vscode-editor-background font-bold text-vscode-foreground";
	const headerClass = clsx(baseClass, classes);
	return <tr className={headerClass}>{children}</tr>;
};
