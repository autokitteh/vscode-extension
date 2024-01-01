import { useEffect, useState } from "react";
import { translate } from "@i18n/index";
import { AKDeploymentState } from "@react-components";
import {
	AKTable,
	AKTableEmptyMessage,
	AKTableCell,
	AKTableHeader,
	AKTableRow,
	AKTableHeaderCell,
} from "@react-components/AKTable";
import { Deployment } from "@type/models/index";
import moment from "moment";

export const AKDeployments = ({ deployments }: { deployments: Deployment[] | undefined }) => {
	const [rerender, setRerender] = useState(0);
	useEffect(() => {
		const interval = setInterval(() => {
			setRerender((rerender) => rerender + 1);
		}, 1000);

		return () => clearInterval(interval);
	}, []);
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
