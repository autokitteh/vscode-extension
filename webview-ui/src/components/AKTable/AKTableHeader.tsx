import React, { ReactNode } from "react";

interface AKTableHeaderProps {
	children: ReactNode;
}

export const AKTableHeader = ({ children }: AKTableHeaderProps) => {
	return (
		<div className="flex justify-around bg-vscode-editorGroup-dropBackground w-[80rem] font-bold">
			{children}
		</div>
	);
};
