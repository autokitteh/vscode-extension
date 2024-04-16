import React, { useRef, useEffect, useState } from "react";
import { usePopper } from "react-popper";

interface PopperProps {
	visible: boolean;
	children: React.ReactNode;
	referenceRef: React.RefObject<HTMLDivElement>;
}

export const PopperComponent: React.FC<PopperProps> = ({ visible, children, referenceRef }) => {
	const popperRef = useRef<HTMLDivElement | null>(null);
	const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
	const { styles, attributes, update } = usePopper(referenceRef.current, popperElement, {
		placement: "bottom",
		modifiers: [
			{
				name: "offset",
				options: {
					offset: [0, 8],
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

	// eslint-disable-next-line max-len
	const popperClasses =
		"flex-col z-50 bg-vscode-editor-background text-vscode-foreground border border-gray-300 p-4 rounded-lg shadow-lg";

	return (
		<>
			{visible && (
				<div ref={popperRef} style={styles.popper} {...attributes.popper} className={popperClasses}>
					{children}
				</div>
			)}
		</>
	);
};
