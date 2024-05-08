import React from "react";
import { AKModal } from "@react-components";
import { AKTable, AKTableCell, AKTableHeader, AKTableHeaderCell, AKTableRow } from "@react-components/AKTable";
import { Connection } from "@type/models";

export const AKConnectionsModal = ({
	onCloseClicked,
	connections,
}: {
	onCloseClicked: () => void;
	connections?: Connection[];
}) => {
	return (
		<AKModal wrapperClasses={["!bg-white z-50"]} classes={["bg-black-semi-transparent", "rounded-none"]}>
			<div
				className="flex justify-end cursor-pointer text-white font-extrabold pt-8 text-xl"
				onClick={() => onCloseClicked()}
			>
				X
			</div>
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
		</AKModal>
	);
};
