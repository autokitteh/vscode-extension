import { useEffect, useState } from "react";
import { DeploymentState } from "@enums";
import { translate } from "@i18n";
import { AKDeploymentTableBody, AKDeploymentTableHeader } from "@react-components";
import { AKTable, AKTableMessage } from "@react-components/AKTable";
import { useDeployments } from "@react-hooks";
import { useModals } from "@react-stores/useModals";
import { Deployment } from "@type/models";

export const AKDeployments = ({ setActiveDeployment }: { setActiveDeployment: (deploymentId: string) => void }) => {
	const { deploymentsSection } = useDeployments();
	const [isLoading, setIsLoading] = useState(true);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [rerender, setRerender] = useState(0);

	const executeDeploymentPopperState = useModals((state) => state.modals["executeDeploymentPopper"]);
	const hideModal = useModals((state) => state.hideModal);
	const [totalDeployments, setTotalDeployments] = useState<number>();
	const [deployments, setDeployments] = useState<Deployment[]>();

	useEffect(() => {
		const interval = setInterval(() => {
			setRerender((rerender) => rerender + 1);
		}, 1000);

		return () => {
			clearInterval(interval);
		};
	}, []);

	const isDeploymentStateStartable = (deploymentState: number) =>
		deploymentState === DeploymentState.INACTIVE_DEPLOYMENT || deploymentState === DeploymentState.DRAINING_DEPLOYMENT;
	useEffect(() => {
		if (deployments) {
			const activeDeploymentId = deployments!.find((d) => !isDeploymentStateStartable(d.state))?.deploymentId as string;

			setActiveDeployment(activeDeploymentId);
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
			{executeDeploymentPopperState && (
				<div className="absolute w-screen h-screen" onClick={() => hideModal("executeDeploymentPopper")} />
			)}
			<AKTable>
				<AKDeploymentTableHeader />
				<AKDeploymentTableBody deployments={deployments} setActiveDeployment={setActiveDeployment} />
			</AKTable>
			{(isLoading || !deployments) && <AKTableMessage>{translate().t("reactApp.general.loading")}</AKTableMessage>}
			{deployments && deployments.length === 0 && (
				<AKTableMessage>{translate().t("reactApp.deployments.noDeployments")}</AKTableMessage>
			)}
		</div>
	);
};

export default AKDeployments;
