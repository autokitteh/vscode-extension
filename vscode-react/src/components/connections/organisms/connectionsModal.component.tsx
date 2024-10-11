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
import { useState } from "react";

export const ConnectionsModal = ({ onClose }: { onClose: () => void }) => {
	const [{ themeType }] = useAppState();
	const [connections, setConnections] = useState<Connection[]>([]);

	useIncomingMessageHandler({
		setConnections,
	});

	const handleConnectionInitClick = (connectionName: string, connectionId: string) => {
		sendMessage(MessageType.openConnectionInitURL, { connectionName, connectionId });
	};

	const handleRefreshClick = () => {
		sendMessage(MessageType.fetchConnections);
	};
	const isDarkTheme = themeType === 2 || themeType === 3;
	const refreshIconColor = isDarkTheme ? "white" : "black";

	return (
		<Modal classes={["bg-black-semi-transparent", "rounded-none"]} wrapperClasses={["!bg-transparent z-50"]}>
			{/* eslint-disable tailwindcss/classnames-order */}
			<div className="bg-vscode-editor-background mt-4 h-[calc(100vh-6vh)]">
				<div className="mr-6 flex justify-end pt-4">
					<CloseIcon className="w-4 cursor-pointer p-0" fill="white" onClick={() => onClose()} />
				</div>
				<div className="m-auto">
					<div className="flex items-center justify-between">
						<div className="flex flex-1" />
						{/* eslint-disable tailwindcss/classnames-order */}
						<div className="text-vscode-foreground mb-6 flex flex-1 justify-center text-center text-4xl">
							{translate().t("reactApp.connections.modalTitle")}
						</div>
						<div className="flex flex-1 justify-end">
							<div
								className="mr-11 flex cursor-pointer flex-row items-center justify-center"
								onClick={() => handleRefreshClick()}
								title={translate().t("reactApp.connections.refreshConnections")}
							>
								<div className="mr-1 w-3">
									<RotateIcon fill={refreshIconColor} />
								</div>
								<span>{translate().t("reactApp.connections.refresh")}</span>
							</div>
						</div>
					</div>
					<div className="mt-2 flex w-full justify-end">
						{connections?.length ? (
							<Table>
								<TableHeader>
									<HeaderCell>{translate().t("reactApp.connections.tableColumns.name")}</HeaderCell>
									<HeaderCell>{translate().t("reactApp.connections.tableColumns.integration")}</HeaderCell>
									<HeaderCell>{translate().t("reactApp.connections.tableColumns.status")}</HeaderCell>
									<HeaderCell>{translate().t("reactApp.connections.tableColumns.information")}</HeaderCell>
									<HeaderCell>{translate().t("reactApp.connections.tableColumns.actions")}</HeaderCell>
								</TableHeader>
								{connections.map(({ connectionId, name, integrationName, status, statusInfoMessage }) => (
									<Row key={connectionId}>
										<Cell classes={["text-vscode-foreground"]}>{name}</Cell>
										<Cell classes={["text-vscode-foreground"]}>{integrationName}</Cell>
										<Cell classes={["text-vscode-foreground"]}>
											<ConnectionStateLabel connectionStatus={status} />
										</Cell>
										<Cell classes={["text-vscode-foreground"]}>{statusInfoMessage}</Cell>
										<Cell classes={["flex justify-center align-center"]}>
											{connectionId && (
												<div
													onClick={() => handleConnectionInitClick(name, connectionId)}
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
