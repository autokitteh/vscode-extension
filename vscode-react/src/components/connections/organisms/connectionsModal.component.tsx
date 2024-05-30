import { useRef } from "react";
import { MessageType } from "@enums";
import { translate } from "@i18n";
import RotateIcon from "@react-assets/icons/rotate.svg?react";
import { Cell, HeaderCell, TableMessage } from "@react-components/atoms/table";
import { Modal, Row, TableHeader } from "@react-components/molecules";
import { Table } from "@react-components/organisms";
import { ConnectionStateLabel } from "@react-components/sessions/atoms";
import { useAppState } from "@react-context";
import { sendMessage } from "@react-utilities";
import { Connection } from "@type/models";

export const ConnectionsModal = ({ onClose, connections }: { onClose: () => void; connections?: Connection[] }) => {
	const [{ themeType }] = useAppState();
	const modalRef = useRef<HTMLDivElement>(null);

	const handleConnectionInitClick = (connectionId: string, connectionInitURL: string) => {
		sendMessage(MessageType.openConnectionInitURL, { connectionId, initURL: connectionInitURL });
	};
	const handleConnectionTestClick = (connectionId: string) => {
		sendMessage(MessageType.testConnection, connectionId);
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
							title="Refresh Connections"
						>
							<div className="w-3 mr-1">
								<RotateIcon fill={refreshIconColor} />
							</div>
							<span>Refresh</span>
						</div>
					</div>
				</div>
				<div className="flex w-full justify-end mt-2">
					{connections?.length ? (
						<Table>
							<TableHeader>
								<HeaderCell>Name</HeaderCell>
								<HeaderCell>Integration</HeaderCell>
								<HeaderCell>Status</HeaderCell>
								<HeaderCell>Information</HeaderCell>
								<HeaderCell>Actions</HeaderCell>
							</TableHeader>
							{connections.map((connection) => (
								<Row key={connection.connectionId}>
									<Cell classes={["text-vscode-foreground"]}>{connection.name}</Cell>
									<Cell classes={["text-vscode-foreground"]}>{connection.integrationName}</Cell>
									<Cell classes={["text-vscode-foreground"]}>
										<ConnectionStateLabel connectionStatus={connection.status} />
									</Cell>
									<Cell classes={["text-vscode-foreground"]}>{connection.statusInfoMessage}</Cell>
									<Cell classes={["flex justify-center"]}>
										{connection.initURL && (
											<div
												onClick={() => handleConnectionInitClick(connection.connectionId, connection.initURL)}
												className="w-3 codicon codicon-gear text-vscode-background cursor-pointer"
												title={translate().t("reactApp.connections.init")}
											/>
										)}
										{connection.isTestable && (
											<div
												title={translate().t("reactApp.connections.test")}
												onClick={() => handleConnectionTestClick(connection.connectionId)}
												className="w-3 codicon codicon-beaker text-vscode-background cursor-pointer ml-2"
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
