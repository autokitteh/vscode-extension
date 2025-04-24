import { MessageType } from "@enums";
import { SessionOutputLog } from "@interfaces";
import { Button, Loader } from "@react-components/atoms";
import { LoadingOverlay } from "@react-components/molecules";
import { useAppState } from "@react-context";
import { useIncomingMessageHandler } from "@react-hooks";
import { sendMessage } from "@react-utilities";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef, useState } from "react";

export const OutputsPopper = () => {
	const parentRef = useRef<HTMLDivElement>(null);
	const [outputs, setOutputs] = useState<SessionOutputLog[] | undefined>();
	const [, dispatch] = useAppState();
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingOverlay, setIsLoadingOverlay] = useState(true);

	const virtualizer = useVirtualizer({
		count: outputs?.length || 0,
		estimateSize: () => 30,
		getScrollElement: () => parentRef.current,
	});

	useEffect(() => {
		setTimeout(() => {
			setIsLoadingOverlay(false);
		}, 500);
	}, []);

	useIncomingMessageHandler({
		setOutputs,
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
		<div className="relative h-full overflow-auto" ref={parentRef}>
			<LoadingOverlay isLoading={isLoadingOverlay} />
			<div
				className="relative w-full"
				style={{
					height: virtualizer.getTotalSize(),
				}}
			>
				<div className="flex justify-end">
					<Button classes="fixed top-2 right-2 z-[60]" onClick={() => close()}>
						X
					</Button>
				</div>
				<div className="font-lg fixed left-4 top-2 font-bold">Session Logs:</div>
				{isLoading ? (
					<div className="bg-vscode-editor-background fixed bottom-3 left-0 w-full">
						<Loader isCenter />
					</div>
				) : null}
				{outputs?.length === 0 ? (
					<div className="font-lg bg-vscode-editor-background fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-bold">
						Logs not found
					</div>
				) : (
					<div
						className="absolute left-0 top-0 mt-1 w-full"
						style={{
							transform: `translateY(${items[0]?.start ?? 0}px)`,
						}}
					>
						{items.map((virtualRow) => (
							<div data-index={virtualRow.index} key={virtualRow.key} ref={virtualizer.measureElement}>
								<div className="flex w-full" style={{ padding: "10px 0" }}>
									<div className="w-[160px] shrink-0">[{outputs?.[virtualRow.index].time}]:</div>
									<div>{outputs?.[virtualRow.index].print}</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};
