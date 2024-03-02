import React from "react";
import { ReactNode } from "react";
import clsx from "clsx";

type ModalProps = {
	children: ReactNode;
	wrapperClasses?: Array<string>;
	classes?: Array<string>;
};
export const AKModal = ({ children, wrapperClasses, classes }: ModalProps) => {
	const wrapperClass = clsx(
		"absolute w-full h-full bg-vscode-editor-background top-0 right-0 z-40 opacity-100",
		wrapperClasses
	);

	const modalClasses = clsx(
		"absolute left-1/2 transform -translate-x-1/2 pb-8 px-14 rounded-3xl opacity-100 w-full h-full",
		classes
	);

	return (
		<div className={wrapperClass}>
			<div className={modalClasses}>{children}</div>
		</div>
	);
};
