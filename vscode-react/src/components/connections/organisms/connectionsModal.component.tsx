import { useEffect, useRef } from "react";
import { translate } from "@i18n";
import { Cell, HeaderCell, TableMessage } from "@react-components/atoms/table";
import { Modal, Row, TableHeader } from "@react-components/molecules";
import { Table } from "@react-components/organisms";
import { useAppState } from "@react-context";
import { Connection } from "@type/models";

export const ConnectionsModal = ({
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
		<Modal classes={["rounded-none"]} ref={modalRef}>
			<div
				className="flex justify-end cursor-pointer text-white font-extrabold pt-8 text-xl"
				onClick={() => onCloseClicked()}
			>
				X
			</div>
			{!delayedLoading && connections?.length ? (
				<Table>
					<TableHeader>
						<HeaderCell>Name</HeaderCell>
						<HeaderCell>ID</HeaderCell>
					</TableHeader>
					{connections?.map((connection) => (
						<Row key={connection.connectionId}>
							<Cell classes={["text-vscode-button-foreground"]}>{connection.name}</Cell>
							<Cell classes={["text-vscode-button-foreground"]}>{connection.connectionId}</Cell>
						</Row>
					))}
				</Table>
			) : (
				<TableMessage>{translate().t("reactApp.connections.noConnectionsFound")}</TableMessage>
			)}
			{delayedLoading && <TableMessage>{translate().t("reactApp.general.loading")}</TableMessage>}
		</Modal>
	);
};
