import clsx from "clsx";
import React, { ReactNode } from "react";

type ModalProps = {
	children: ReactNode;
	classes?: Array<string>;
	wrapperClasses?: Array<string>;
};
export const Modal = ({ children, classes, wrapperClasses }: ModalProps) => {
	const wrapperClass = clsx(
		"bg-vscode-editor-background absolute right-0 top-0 z-40 size-full opacity-100",
		wrapperClasses
	);

	const modalClasses = clsx("absolute left-1/2 size-full -translate-x-1/2 rounded-3xl px-14 pb-8 opacity-100", classes);

	return (
		<div className={wrapperClass}>
			<div className={modalClasses}>{children}</div>
		</div>
	);
};
