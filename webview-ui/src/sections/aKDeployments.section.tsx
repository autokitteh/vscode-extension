import { Deployment } from "@ak-proto-ts/deployments/v1/deployment_pb";
import {
	AKTable,
	AKTableEmptyMessage,
	AKTableCell,
	AKTableHeader,
	AKTableRow,
	AKTableHeaderCell,
} from "@components/AKTable";
import { translate } from "@i18n/index";
import moment from "moment";

export const AKDeployments = ({ deployments }: { deployments: Deployment[] | undefined }) => {
	return (
		<div>
			<AKTable classes="mt-4">
				<AKTableHeader>
					<AKTableHeaderCell>{translate().t("reactAppDeployments.time")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactAppDeployments.status")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactAppDeployments.sessions")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactAppDeployments.buildId")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactAppDeployments.actions")}</AKTableHeaderCell>
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
							<AKTableCell>
								<div className="codicon codicon-debug-rerun"></div>
								<div className="codicon codicon-close"></div>
							</AKTableCell>
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
