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
	const scrollTimeoutRef = useRef<NodeJS.Timeout>();

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
		setOutputs: (newOutputs) => {
			setOutputs(newOutputs);
			setIsLoading(false);
		},
	});

	const items = virtualizer.getVirtualItems();

	const handleScroll = useCallback(() => {
		if (!parentRef.current) {
			return;
		}

		const { clientHeight, scrollHeight, scrollTop } = parentRef.current;
		const reachedBottom = scrollTop + clientHeight >= scrollHeight - 50;
		const hasScroll = scrollHeight > clientHeight;
		const canScrollDown = hasScroll && !reachedBottom;

		if (scrollTimeoutRef.current) {
			clearTimeout(scrollTimeoutRef.current);
		}

		setShowArrowDown(false);

		scrollTimeoutRef.current = setTimeout(() => {
			setShowArrowDown(canScrollDown);
		}, 150);

		if (reachedBottom && !isLoading && scrollTop > 0) {
			setIsLoading(true);
			sendMessage(MessageType.loadMoreSessionsOutputs);
		}
	}, [isLoading]);

	useEffect(() => {
		if (parentRef.current) {
			const { clientHeight, scrollHeight, scrollTop } = parentRef.current;
			const reachedBottom = scrollTop + clientHeight >= scrollHeight - 50;
			const hasScroll = scrollHeight > clientHeight;
			const canScrollDown = hasScroll && !reachedBottom;
			setShowArrowDown(canScrollDown);
		}
	}, [outputs]);

	useEffect(() => {
		const currentRef = parentRef.current;
		if (currentRef) {
			currentRef.addEventListener("scroll", handleScroll);

			return () => {
				currentRef.removeEventListener("scroll", handleScroll);
				if (scrollTimeoutRef.current) {
					clearTimeout(scrollTimeoutRef.current);
				}
			};
		}
	}, [handleScroll]);

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
					<Button onClick={close}>X</Button>
				</div>
				{isLoading && (
					<div className="bg-vscode-editor-background fixed bottom-4 left-0 w-full">
						<Loader isCenter />
					</div>
				)}
				{showArrowDown && (
					<div className="fixed bottom-4 right-8 animate-bounce">
						<div className="codicon codicon-arrow-down text-vscode-foreground text-2xl" />
					</div>
				)}

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
					</div>
				)}
			</div>
		</div>
	);
};
