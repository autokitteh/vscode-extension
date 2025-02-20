import { MessageType } from "@enums";
import { SessionOutputLog } from "@interfaces";
import { Button } from "@react-components/atoms";
import { useAppState } from "@react-context";
import { useIncomingMessageHandler } from "@react-hooks";
import { sendMessage } from "@react-utilities";
import { useVirtualizer } from "@tanstack/react-virtual";
import React, { useEffect, useRef, useState } from "react";

export const OutputsPopper = () => {
	const parentRef = useRef<HTMLDivElement>(null);
	const [outputs, setOutputs] = useState<SessionOutputLog[]>([]);
	const [, dispatch] = useAppState();
	const [isLoading, setIsLoading] = useState(false);

	const virtualizer = useVirtualizer({
		count: outputs.length,
		estimateSize: () => 30,
		getScrollElement: () => parentRef.current,
	});

	useIncomingMessageHandler({
		setOutputs: (newOutputs) => {
			setOutputs(newOutputs);
			setIsLoading(false);
		},
	});

	const items = virtualizer.getVirtualItems();

	const handleScroll = () => {
		if (parentRef.current) {
			const { clientHeight, scrollHeight, scrollTop } = parentRef.current;

			if (scrollTop + clientHeight >= scrollHeight - 50) {
				setIsLoading(true);
				sendMessage(MessageType.loadMoreSessionsOutputs);
			}
		}
	};

	useEffect(() => {
		const currentRef = parentRef.current;
		if (currentRef) {
			currentRef.addEventListener("scroll", handleScroll);

			return () => currentRef.removeEventListener("scroll", handleScroll);
		}
	}, []);

	const close = () => dispatch({ payload: "", type: "SET_MODAL_NAME" });

	return (
		<div
			ref={parentRef}
			style={{
				height: "100%",
				overflow: "auto",
				position: "relative",
			}}
		>
			<div
				style={{
					height: virtualizer.getTotalSize(),
					position: "relative",
					width: "100%",
				}}
			>
				<div className="flex justify-end">
					<Button classes="fixed top-2 right-2 z-40" onClick={() => close()}>
						X
					</Button>
				</div>
				<div className="font-lg bg-vscode-editor-background fixed left-2 top-2 font-bold">Session Logs:</div>
				{isLoading ? (
					<div className="font-lg bg-vscode-editor-background fixed bottom-2 m-auto font-bold">Loading...</div>
				) : null}
				<div
					style={{
						left: 0,
						marginTop: "50px",
						position: "absolute",
						top: 0,
						transform: `translateY(${items[0]?.start ?? 0}px)`,
						width: "100%",
					}}
				>
					{items.map((virtualRow) => (
						<div data-index={virtualRow.index} key={virtualRow.key} ref={virtualizer.measureElement}>
							<div className="flex w-full" style={{ padding: "10px 0" }}>
								<div className="w-[160px] shrink-0">[{outputs[virtualRow.index].time}]:</div>
								<div>{outputs[virtualRow.index].print}</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};
