import moment from "moment";
import { Deployment } from "../../../src/types";
import {
	AKTable,
	AKTableEmptyMessage,
	AKTableCell,
	AKTableHeader,
	AKTableRow,
	AKTableHeaderCell,
} from "../components/AKTable";

export const Deployments = ({ deployments }: { deployments: Deployment[] | undefined }) => {
	return (
		<div>
			<AKTable classes="mt-4">
				<AKTableHeader>
					<AKTableHeaderCell>Deploy Time</AKTableHeaderCell>
					<AKTableHeaderCell>Status</AKTableHeaderCell>
					<AKTableHeaderCell>Sessions</AKTableHeaderCell>
					<AKTableHeaderCell>Build-ID (Optional)</AKTableHeaderCell>
					<AKTableHeaderCell>Actions</AKTableHeaderCell>
				</AKTableHeader>
				{deployments &&
					deployments.map((deployment) => (
						<AKTableRow key={deployment.deploymentId}>
							<AKTableCell>{moment(deployment.createdAt).fromNow()}</AKTableCell>
							<AKTableCell>{deployment.state}</AKTableCell>
							<AKTableCell>0</AKTableCell>
							<AKTableCell>{deployment.buildId}</AKTableCell>
							<AKTableCell>TODO</AKTableCell>
						</AKTableRow>
					))}
			</AKTable>
			{!deployments && <AKTableEmptyMessage>Loading...</AKTableEmptyMessage>}
			{deployments && deployments.length === 0 && (
				<AKTableEmptyMessage>No deployments found</AKTableEmptyMessage>
			)}
		</div>
	);
};

export default Deployments;
