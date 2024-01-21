import React, { ReactNode } from "react";

interface AKTableMessageProps {
	children: ReactNode;
}

export const AKTableMessage = ({ children }: AKTableMessageProps) => {
	return <div className="w-full text-center m-4">{children}</div>;
};
