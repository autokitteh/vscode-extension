import { MessageType } from "@enums";
import { SessionOutputLog } from "@interfaces";
import { Button, Loader } from "@react-components/atoms";
import { LoadingOverlay } from "@react-components/molecules";
import { useAppState } from "@react-context";
import { useIncomingMessageHandler } from "@react-hooks";
import { sendMessage } from "@react-utilities";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useRef, useState } from "react";

export const OutputsPopper = () => {
	const parentRef = useRef<HTMLDivElement>(null);
	const [outputs, setOutputs] = useState<SessionOutputLog[] | undefined>();
	const [, dispatch] = useAppState();
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingOverlay, setIsLoadingOverlay] = useState(true);
	const [showArrowDown, setShowArrowDown] = useState(false);
	const [lastScrollTop, setLastScrollTop] = useState(0);

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

	const checkIfScrollable = useCallback(() => {
		if (parentRef.current) {
			const { clientHeight, scrollHeight } = parentRef.current;

			return scrollHeight > clientHeight;
		}

		return false;
	}, [parentRef]);

	useIncomingMessageHandler({
		setOutputs: (newOutputs) => {
			setOutputs(newOutputs);
			setIsLoading(false);
			if (checkIfScrollable()) {
				setShowArrowDown(true);
			}
		},
	});

	const items = virtualizer.getVirtualItems();

	const handleScroll = () => {
		if (parentRef.current) {
			const { clientHeight, scrollHeight, scrollTop } = parentRef.current;

			if (checkIfScrollable() && showArrowDown) {
				setShowArrowDown(false);
			}
			setLastScrollTop(scrollTop);

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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [lastScrollTop, showArrowDown]);

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
				<div className="bg-vscode-editor-background fixed left-0 top-0 z-50 flex w-full justify-between border border-b-0 border-gray-300 p-4">
					<div className="text-base font-bold">Session Logs:</div>
					<Button onClick={() => close()}>X</Button>
				</div>
				{isLoading ? (
					<div className="bg-vscode-editor-background absolute bottom-2 left-0 w-full">
						<Loader isCenter />
					</div>
				) : null}
				{outputs?.length === 0 ? (
					<div className="font-lg bg-vscode-editor-background fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-bold">
						Logs not found
					</div>
				) : (
					<div
						className="absolute left-0 top-0 mt-10 w-full"
						style={{
							transform: `translateY(${items[0]?.start ?? 0}px)`,
						}}
					>
						{items.map((virtualRow) => (
							<div data-index={virtualRow.index} key={virtualRow.key} ref={virtualizer.measureElement}>
								<div className="flex w-full text-sm">
									<div className="w-[160px] shrink-0">[{outputs?.[virtualRow.index].time}]:</div>
									<div>{outputs?.[virtualRow.index].print}</div>
								</div>
							</div>
						))}

						{showArrowDown && (
							<div className="absolute bottom-0 right-10 animate-bounce">
								<div className="codicon codicon-arrow-down text-vscode-foreground text-2xl" />
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};
