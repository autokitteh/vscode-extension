import React, { useRef, useEffect, useState } from "react";

import { usePopper } from "react-popper";

import { cn } from "@react-utilities";

interface PopperProps {
	visible: boolean;
	className?: string;
	children: React.ReactNode;
	referenceRef: React.RefObject<HTMLDivElement>;
}

export const Popper = ({ visible, children, referenceRef, className }: PopperProps) => {
	const popperRef = useRef<HTMLDivElement | null>(null);
	const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
	const { styles, attributes, update } = usePopper(referenceRef.current, popperElement, {
		placement: "bottom",
		modifiers: [
			{
				name: "offset",
				options: {
					offset: [-200, 8],
				},
			},
		],
	});

	useEffect(() => {
		if (visible && update) {
			update().catch((error) => console.error(error));
		}
	}, [visible, update]);

	useEffect(() => {
		if (visible) {
			setPopperElement(popperRef.current);
		}
	}, [visible]);

	const popperClasses = cn(
		"flex-col z-50 bg-vscode-editor-background text-vscode-foreground border border-gray-300 p-4 rounded-lg shadow-lg",
		className
	);

	return (
		<>
			{visible && (
				<div
					ref={popperRef}
					style={styles.popper}
					{...attributes.popper}
					className={popperClasses}
					onClick={(event) => event.stopPropagation()}
				>
					{children}
				</div>
			)}
		</>
	);
};
