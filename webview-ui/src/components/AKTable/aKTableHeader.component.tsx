import React, { ReactNode } from "react";

interface AKTableHeaderProps {
	children: ReactNode;
}

export const AKTableHeader = ({ children }: AKTableHeaderProps) => {
	return <tr className="bg-vscode-editorGroup-dropBackground font-bold">{children}</tr>;
};
