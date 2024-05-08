import React from "react";
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

	return (
		<AKModal wrapperClasses={["!bg-white z-50"]} classes={["bg-black-semi-transparent", "rounded-none"]}>
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
							<AKTableCell>{connection.name}</AKTableCell>
							<AKTableCell>{connection.connectionId}</AKTableCell>
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
