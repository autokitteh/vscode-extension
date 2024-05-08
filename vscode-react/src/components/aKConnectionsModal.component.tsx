import { useEffect, useRef } from "react";
import { translate } from "@i18n";
import { AKModal } from "@react-components";
import {
	AKTable,
	AKTableCell,
	AKTableHeader,
	AKTableHeaderCell,
	AKTableMessage,
	AKTableRow,
} from "@react-components/AKTable";
import { useAppState } from "@react-context";
import { Connection } from "@type/models";

export const AKConnectionsModal = ({
	onCloseClicked,
	connections,
}: {
	onCloseClicked: () => void;
	connections?: Connection[];
}) => {
	const [{ delayedLoading }] = useAppState();

	const modalRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const vscodeEditorBackground = getComputedStyle(document.documentElement)
			.getPropertyValue("--vscode-button-background")
			.trim();

		const hexToRGBA = (hex: string, opacity: number) => {
			let r = 0,
				g = 0,
				b = 0;
			if (hex.length === 4) {
				r = parseInt(hex[1] + hex[1], 16);
				g = parseInt(hex[2] + hex[2], 16);
				b = parseInt(hex[3] + hex[3], 16);
			} else if (hex.length === 7) {
				r = parseInt(hex[1] + hex[2], 16);
				g = parseInt(hex[3] + hex[4], 16);
				b = parseInt(hex[5] + hex[6], 16);
			}
			return `rgba(${r},${g},${b},${opacity})`;
		};

		if (modalRef.current) {
			modalRef.current.style.backgroundColor = hexToRGBA(vscodeEditorBackground, 0.98);
		}
	}, []);

	return (
		<AKModal classes={["rounded-none"]} ref={modalRef}>
			<div
				className="flex justify-end cursor-pointer text-white font-extrabold pt-8 text-xl"
				onClick={() => onCloseClicked()}
			>
				X
			</div>
			{!delayedLoading && connections?.length ? (
				<AKTable>
					<AKTableHeader>
						<AKTableHeaderCell>Name</AKTableHeaderCell>
						<AKTableHeaderCell>ID</AKTableHeaderCell>
					</AKTableHeader>
					{connections?.map((connection) => (
						<AKTableRow key={connection.connectionId}>
							<AKTableCell classes={["text-vscode-button-foreground"]}>{connection.name}</AKTableCell>
							<AKTableCell classes={["text-vscode-button-foreground"]}>{connection.connectionId}</AKTableCell>
						</AKTableRow>
					))}
				</AKTable>
			) : (
				<AKTableMessage>{translate().t("reactApp.connections.noConnectionsFound")}</AKTableMessage>
			)}
			{delayedLoading && <AKTableMessage>{translate().t("reactApp.general.loading")}</AKTableMessage>}
		</AKModal>
	);
};
