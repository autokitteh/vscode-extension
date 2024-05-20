import { useRef } from "react";
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

	return (
		<Modal classes={["rounded-none"]} ref={modalRef} wrapperClasses={["bg-transparent", "z-50"]}>
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
