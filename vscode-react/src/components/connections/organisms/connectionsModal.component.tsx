import { useRef, useState } from "react";
import { MessageType } from "@enums";
import { translate } from "@i18n";
import RotateIcon from "@react-assets/icons/rotate.svg?react";
import { Cell, HeaderCell, TableMessage } from "@react-components/atoms/table";
import { Modal, Row, TableHeader } from "@react-components/molecules";
import { Table } from "@react-components/organisms";
import { ConnectionStateLabel } from "@react-components/sessions/atoms";
import { useAppState } from "@react-context";
import { useIncomingMessageHandler } from "@react-hooks";
import { sendMessage } from "@react-utilities";
import { Connection } from "@type/models";

export const ConnectionsModal = ({ onClose }: { onClose: () => void }) => {
	const [{ themeType }] = useAppState();
	const modalRef = useRef<HTMLDivElement>(null);
	const [connections, setConnections] = useState<Connection[]>([]);

	useIncomingMessageHandler({
		setConnections,
	});

	const handleConnectionInitClick = (connectionId: string, connectionInitURL: string) => {
		sendMessage(MessageType.openConnectionInitURL, { connectionId, initURL: connectionInitURL });
	};

	const handleRefreshClick = () => {
		sendMessage(MessageType.fetchConnections);
	};
	const isDarkTheme = themeType === 2 || themeType === 3;
	const refreshIconColor = isDarkTheme ? "white" : "black";

	return (
		<Modal classes={["rounded-none"]} ref={modalRef} wrapperClasses={["z-50"]}>
			<div
				className="flex justify-end cursor-pointer text-vscode-foreground font-extrabold pt-8 text-xl leading-3"
				onClick={() => onClose()}
			>
				X
			</div>
			<div className="m-auto">
				<div className="flex justify-between items-center">
					<div className="flex flex-1" />
					<div className="flex flex-1 text-4xl text-vscode-foreground text-center mb-6">Connections</div>
					<div className="flex flex-1 justify-end">
						<div
							className="flex flex-row items-center justify-center cursor-pointer mr-11"
							onClick={() => handleRefreshClick()}
							title={translate().t("reactApp.connections.refreshConnections")}
						>
							<div className="w-3 mr-1">
								<RotateIcon fill={refreshIconColor} />
							</div>
							<span>{translate().t("reactApp.connections.refresh")}</span>
						</div>
					</div>
				</div>
				<div className="flex w-full justify-end mt-2">
					{connections?.length ? (
						<Table>
							<TableHeader>
								<HeaderCell>{translate().t("reactApp.connections.tableColumns.name")}</HeaderCell>
								<HeaderCell>{translate().t("reactApp.connections.tableColumns.integration")}</HeaderCell>
								<HeaderCell>{translate().t("reactApp.connections.tableColumns.status")}</HeaderCell>
								<HeaderCell>{translate().t("reactApp.connections.tableColumns.information")}</HeaderCell>
								<HeaderCell>{translate().t("reactApp.connections.tableColumns.actions")}</HeaderCell>
							</TableHeader>
							{connections.map((connection) => (
								<Row key={connection.connectionId}>
									<Cell classes={["text-vscode-foreground"]}>{connection.name}</Cell>
									<Cell classes={["text-vscode-foreground"]}>{connection.integrationName}</Cell>
									<Cell classes={["text-vscode-foreground"]}>
										<ConnectionStateLabel connectionStatus={connection.status} />
									</Cell>
									<Cell classes={["text-vscode-foreground"]}>{connection.statusInfoMessage}</Cell>
									<Cell classes={["flex justify-center align-center"]}>
										{connection.initURL && (
											<div
												onClick={() => handleConnectionInitClick(connection.connectionId, connection.initURL)}
												className="w-3 codicon codicon-gear text-white cursor-pointer"
												title={translate().t("reactApp.connections.init")}
											/>
										)}
									</Cell>
								</Row>
							))}
						</Table>
					) : (
						<TableMessage>{translate().t("reactApp.connections.noConnectionsFound")}</TableMessage>
					)}
				</div>
			</div>
		</Modal>
	);
};
