import {
	AKTable,
	AKTableEmptyMessage,
	AKTableCell,
	AKTableHeader,
	AKTableRow,
	AKTableHeaderCell,
} from "@components/AKTable";
import { Deployment } from "@parent-ak-proto-ts/deployments/v1/deployment_pb";
import moment from "moment";

export const AKDeployments = ({ deployments }: { deployments: Deployment[] | undefined }) => {
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
							<AKTableCell>
								{moment(deployment.createdAt as unknown as string).fromNow()}
							</AKTableCell>
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

export default AKDeployments;
