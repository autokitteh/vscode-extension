import { useState } from "react";

import { MessageType } from "@enums";
import { translate } from "@i18n";
import CloseIcon from "@react-assets/icons/close.svg?react";
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
	const [connections, setConnections] = useState<Connection[]>([]);

	useIncomingMessageHandler({
		setConnections,
	});

	const handleConnectionInitClick = (connectionName: string, connectionInitURL: string, connectionId: string) => {
		sendMessage(MessageType.openConnectionInitURL, { connectionName, initURL: connectionInitURL, connectionId });
	};

	const handleRefreshClick = () => {
		sendMessage(MessageType.fetchConnections);
	};
	const isDarkTheme = themeType === 2 || themeType === 3;
	const refreshIconColor = isDarkTheme ? "white" : "black";

	return (
		<Modal wrapperClasses={["!bg-transparent z-50"]} classes={["bg-black-semi-transparent", "rounded-none"]}>
			<div className="mt-4 h-[calc(100vh-6vh)] bg-vscode-editor-background">
				<div className="flex justify-end pt-4 mr-6">
					<CloseIcon fill="white" onClick={() => onClose()} className="w-4 p-0 cursor-pointer" />
				</div>
				<div className="m-auto">
					<div className="flex justify-between items-center">
						<div className="flex flex-1" />
						<div className="flex flex-1 text-4xl text-vscode-foreground text-center mb-6 justify-center">
							{translate().t("reactApp.connections.modalTitle")}
						</div>
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
								{connections.map(({ connectionId, name, integrationName, status, statusInfoMessage, initURL }) => (
									<Row key={connectionId}>
										<Cell classes={["text-vscode-foreground"]}>{name}</Cell>
										<Cell classes={["text-vscode-foreground"]}>{integrationName}</Cell>
										<Cell classes={["text-vscode-foreground"]}>
											<ConnectionStateLabel connectionStatus={status} />
										</Cell>
										<Cell classes={["text-vscode-foreground"]}>{statusInfoMessage}</Cell>
										<Cell classes={["flex justify-center align-center"]}>
											{initURL && (
												<div
													onClick={() => handleConnectionInitClick(name, initURL, connectionId)}
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
			</div>
		</Modal>
	);
};
