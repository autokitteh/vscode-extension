import { Deployment } from "@ak-proto-ts/deployments/v1/deployment_pb";
import { AKDeploymentState } from "@components";
import {
	AKTable,
	AKTableEmptyMessage,
	AKTableCell,
	AKTableHeader,
	AKTableRow,
	AKTableHeaderCell,
} from "@components/AKTable";
import { ACTIVE_DEPLOYMENT } from "@constants/projectDeployment.constants";
import { translate } from "@i18n/index";
import { Message, MessageType } from "@type/index";
import { vscodeWrapper } from "@utilities";
import moment from "moment";

export const AKDeployments = ({ deployments }: { deployments: Deployment[] | undefined }) => {
	const copyDeploymentId = (deploymentId: string) => {
		vscodeWrapper.postMessage({
			type: MessageType.copyDeploymentId,
			payload: deploymentId,
		} as Message);
	};

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
					deployments
						.sort((a, b) => {
							const aDate = new Date(a.createdAt as unknown as string);
							const bDate = new Date(b.createdAt as unknown as string);
							if (aDate > bDate) {
								return -1;
							}
							if (aDate < bDate) {
								return 1;
							}
							return 0;
						})
						.map((deployment) => (
							<AKTableRow key={deployment.deploymentId}>
								<AKTableCell classes={["cursor-pointer"]}>
									{moment(deployment.createdAt as unknown as string).fromNow()}
								</AKTableCell>
								<AKTableCell classes={["cursor-pointer"]}>
									<div className="flex justify-center">
										<AKDeploymentState deploymentState={deployment.state.toString()} />
									</div>
								</AKTableCell>
								<AKTableCell classes={["cursor-pointer"]}>0</AKTableCell>
								<AKTableCell>
									<button
										onClick={() => copyDeploymentId(deployment.buildId)}
										title="Copy Build-ID"
									>
										<div className="codicon codicon-copy" />
									</button>{" "}
									{deployment.buildId}
								</AKTableCell>
								<AKTableCell>
									{deployment.state.toString() !== ACTIVE_DEPLOYMENT ? (
										<button title="Activate deployment">
											<div className="codicon codicon-debug-start text-green-400" />
										</button>
									) : (
										<button title="Deactivate deployment">
											<div className="codicon codicon-stop text-red-400" />
										</button>
									)}
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
