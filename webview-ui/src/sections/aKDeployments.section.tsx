import { AKDeploymentState } from "@components";
import {
	AKTable,
	AKTableEmptyMessage,
	AKTableCell,
	AKTableHeader,
	AKTableRow,
	AKTableHeaderCell,
} from "@components/AKTable";
import { translate } from "@i18n/index";
import { Deployment } from "@type/models/deployment.type";
import moment from "moment";

export const AKDeployments = ({ deployments }: { deployments: Deployment[] | undefined }) => {
	return (
		<div>
			<AKTable classes="mt-4">
				<AKTableHeader>
					<AKTableHeaderCell>{translate().t("reactApp.deployments.time")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactApp.deployments.status")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactApp.deployments.sessions")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactApp.deployments.buildId")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactApp.deployments.actions")}</AKTableHeaderCell>
				</AKTableHeader>
				{deployments &&
					deployments.map((deployment) => (
						<AKTableRow key={deployment.deploymentId}>
							<AKTableCell>
								{moment(deployment.createdAt as unknown as string).fromNow()}
							</AKTableCell>
							<AKTableCell>
								<div className="flex justify-center">
									<AKDeploymentState deploymentState={deployment.state.toString()} />
								</div>
							</AKTableCell>
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
