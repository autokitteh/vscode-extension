import { Overlay } from "@react-components/atoms";
import { OutputsPopper, Popper } from "@react-components/molecules";
import { useAppState } from "@react-context";
import React, { useRef } from "react";
import { createPortal } from "react-dom";

export const SessionLogView = () => {
	const outputsPopperElementRef = useRef<HTMLDivElement | null>(null);
	const [{ modalName }, dispatch] = useAppState();

	return createPortal(
		<div>
			<Overlay
				className="size-full"
				isVisibile={modalName === "sessionOutputs"}
				onOverlayClick={() => dispatch({ payload: "", type: "SET_MODAL_NAME" })}
			/>
			<Popper className="size-full" referenceRef={outputsPopperElementRef} visible={modalName === "sessionOutputs"}>
				<OutputsPopper />
			</Popper>
		</div>,
		document.body
	);
};
