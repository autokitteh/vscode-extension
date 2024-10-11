import clsx from "clsx";
import React, { ReactNode } from "react";

interface TableHeaderProps {
	children: ReactNode;
	classes?: string;
}

export const TableHeader = ({ children, classes }: TableHeaderProps) => {
	const baseClass = "bg-vscode-editor-background font-bold text-vscode-foreground";
	const headerClass = clsx(baseClass, classes);

	return <tr className={headerClass}>{children}</tr>;
};
