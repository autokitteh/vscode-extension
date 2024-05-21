import { useRef } from "react";
import { PlugConnectionIcon } from "@assets/icons/plugConnection.icon";
import { MessageType } from "@enums";
import { translate } from "@i18n";
import { Button } from "@react-components/atoms";
import { Cell, HeaderCell, TableMessage } from "@react-components/atoms/table";
import { Modal, Row, TableHeader } from "@react-components/molecules";
import { Table } from "@react-components/organisms";
import { useAppState } from "@react-context";
import { sendMessage } from "@react-utilities";
import { Connection } from "@type/models";

export const ConnectionsModal = ({ onClose, connections }: { onClose: () => void; connections?: Connection[] }) => {
	const [{ delayedLoading }] = useAppState();

	const modalRef = useRef<HTMLDivElement>(null);

	const handleConnectionInitClick = (connectionInitURL: string) => {
		sendMessage(MessageType.openConnectionInitURL, connectionInitURL);
	};

	return (
		<Modal classes={["rounded-none"]} ref={modalRef} wrapperClasses={["bg-transparent", "z-50"]}>
			<div
				className="flex justify-end cursor-pointer text-vscode-foreground font-extrabold pt-8 text-xl leading-3"
				onClick={() => onClose()}
			>
				X
			</div>
			<div className="m-auto">
				<div className="text-4xl text-vscode-foreground text-center mb-6">Connections</div>
				<div className="flex w-full justify-end mt-2">
					{!delayedLoading && connections?.length ? (
						<Table>
							<TableHeader>
								<HeaderCell>Name</HeaderCell>
								<HeaderCell>ID</HeaderCell>
								<HeaderCell>Init</HeaderCell>
							</TableHeader>
							{connections?.map((connection) => (
								<Row key={connection.connectionId}>
									<Cell classes={["text-vscode-foreground"]}>{connection.name}</Cell>
									<Cell classes={["text-vscode-foreground"]}>{connection.connectionId}</Cell>
									<Cell classes={["flex justify-center"]}>
										<Button classes="pointer" onClick={() => handleConnectionInitClick(connection.links.init_url)}>
											<PlugConnectionIcon className="fill-vscode-button-foreground w-4" />
										</Button>
									</Cell>
								</Row>
							))}
						</Table>
					) : (
						<TableMessage>{translate().t("reactApp.connections.noConnectionsFound")}</TableMessage>
					)}
					{delayedLoading && <TableMessage>{translate().t("reactApp.general.loading")}</TableMessage>}
				</div>
			</div>
		</Modal>
	);
};
