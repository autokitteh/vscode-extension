import { useContext, useEffect, useState } from "react";
import { translate } from "@i18n";
import { AKDeploymentTableBody, AKDeploymentTableHeader } from "@react-components";
import { AKTable, AKTableMessage } from "@react-components/AKTable";
import { ExecutionDeploymentContext } from "@react-context";
import { useDeployments, useForceRerender } from "@react-hooks";
import { Deployment } from "@type/models";

export const AKDeployments = () => {
	useForceRerender();

	const { deploymentsSection } = useDeployments();
	const [isLoading, setIsLoading] = useState(true);
	const [totalDeployments, setTotalDeployments] = useState<number>();
	const [deployments, setDeployments] = useState<Deployment[]>();
	const { setLastDeployment } = useContext(ExecutionDeploymentContext);

	useEffect(() => {
		if (deployments && deployments.length) {
			setLastDeployment(deployments[deployments.length - 1].deploymentId);
		}
		if (deployments && isLoading) {
			setIsLoading(false);
		}
	}, [deployments]);

	useEffect(() => {
		if (deploymentsSection) {
			setTotalDeployments(deploymentsSection.totalDeployments);
			setDeployments(deploymentsSection?.deployments);
		}
	}, [deploymentsSection]);

	return (
		<div className="mt-4 h-[43vh] overflow-y-auto overflow-x-hidden">
			<div className="flex items-baseline">
				<h1 className="flex text-lg font-extralight mb-2">{translate().t("reactApp.deployments.tableTitle")}</h1>
				<div className="ml-1 text-lg font-extralight">({totalDeployments})</div>
			</div>
			<AKTable>
				<AKDeploymentTableHeader />
				<AKDeploymentTableBody deployments={deployments} setActiveDeployment={setLastDeployment} />
			</AKTable>
			{(isLoading || !deployments) && <AKTableMessage>{translate().t("reactApp.general.loading")}</AKTableMessage>}
			{deployments && deployments.length === 0 && (
				<AKTableMessage>{translate().t("reactApp.deployments.noDeployments")}</AKTableMessage>
			)}
		</div>
	);
};

export default AKDeployments;
