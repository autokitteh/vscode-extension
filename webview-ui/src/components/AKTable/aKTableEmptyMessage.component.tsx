import React, { ReactNode } from "react";

interface AKTableEmptyMessageProps {
	children: ReactNode;
}

export const AKTableEmptyMessage = ({ children }: AKTableEmptyMessageProps) => {
	return <div className="w-full text-center m-4">{children}</div>;
};
