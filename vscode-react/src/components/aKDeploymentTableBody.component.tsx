import React, { useEffect, useRef, useState } from "react";
import { DeploymentState, MessageType, SessionStateType } from "@enums";
import { translate } from "@i18n";
import { AKDeploymentState } from "@react-components";
import { AKButton } from "@react-components/aKButton.component";
import { AKTableCell, AKTableRow } from "@react-components/AKTable";
import { useDeployments } from "@react-hooks";
import { getTimePassed, sendMessage } from "@react-utilities";
import { cn } from "@react-utilities/cnClasses.utils";
import { Deployment, SessionEntrypoint } from "@type/models";
import { VSCodeDropdown } from "@vscode/webview-ui-toolkit/react";
import { usePopper } from "react-popper";

export const AKDeploymentTableBody = ({ deployments }: { deployments?: Deployment[] }) => {
	const { selectedDeploymentId, entrypoints } = useDeployments();

	useEffect(() => {
		if (typeof selectedDeploymentId === "string") {
			setSelectedDeployment(selectedDeploymentId);
		}
	}, [selectedDeploymentId]);

	const referenceEl = useRef<HTMLDivElement | null>(null);
	const popperEl = useRef<HTMLDivElement | null>(null);
	const isDeploymentStateStartable = (deploymentState: number) =>
		deploymentState === DeploymentState.INACTIVE_DEPLOYMENT || deploymentState === DeploymentState.DRAINING_DEPLOYMENT;
	const [selectedFile, setSelectedFile] = useState<string>("");
	const [selectedFunction, setSelectedFunction] = useState<string>("");
	const [selectedEntrypoint, setSelectedEntrypoint] = useState<SessionEntrypoint>();

	const [selectedDeployment, setSelectedDeployment] = useState("");
	const [files, setFiles] = useState<Record<string, SessionEntrypoint[]>>();
	const [functions, setFunctions] = useState<SessionEntrypoint[]>();
	const getSessionStateCount = (deployment: Deployment, state: string) => {
		if (!deployment.sessionStats) {
			return translate().t("reactApp.general.unknown");
		}
		const session = deployment.sessionStats.find((s) => s.state === state);
		return session ? session.count : 0;
	};
	const { attributes, styles } = usePopper(referenceEl.current, popperEl.current, {
		placement: "bottom",
		modifiers: [
			{
				name: "offset",
				options: {
					offset: [0, 10],
				},
			},
		],
	});
	const [displayExecutePopper, setDisplayExecutePopper] = useState<boolean>(false);
	const popperClasses = cn(
		"flex-col z-30 bg-vscode-editor-background text-vscode-foreground",
		"border border-gray-300 p-4 rounded-lg shadow-lg"
	);

	const deactivateBuild = (deploymentId: string) => {
		sendMessage(MessageType.deactivateDeployment, deploymentId);
	};

	const activateBuild = (deploymentId: string) => {
		sendMessage(MessageType.activateDeployment, deploymentId);
	};

	const togglePopper = () => {
		setDisplayExecutePopper(true);
	};
	const getSessionsByDeploymentId = (deploymentId: string) => {
		sendMessage(MessageType.selectDeployment, deploymentId);
		setSelectedDeployment(deploymentId);
	};

	const [displayedErrors, setDisplayedErrors] = useState<Record<string, boolean>>({});

	useEffect(() => {
		if (entrypoints && Object.keys(entrypoints).length) {
			setFiles(entrypoints);
			setSelectedFile(Object.keys(entrypoints)[0]);
			setFunctions(entrypoints[Object.keys(entrypoints)[0]]);
			setSelectedFunction(JSON.stringify(entrypoints[Object.keys(entrypoints)[0]][0]));
			setSelectedEntrypoint(entrypoints[Object.keys(entrypoints)[0]][0]);
		}
	}, [entrypoints]);

	const startSession = () => {
		const lastDeployment = deployments![0];

		setDisplayedErrors({});

		if (!selectedFile || !selectedFunction) {
			if (!selectedFile) {
				setDisplayedErrors({ ...displayedErrors, selectedFile: true });
			}
			if (!selectedFunction) {
				setDisplayedErrors({ ...displayedErrors, selectedFunction: true });
			}
			return;
		}

		const startSessionArgs = {
			buildId: lastDeployment.buildId,
			deploymentId: lastDeployment.deploymentId,
			entrypoint: selectedEntrypoint,
		};

		sendMessage(MessageType.startSession, startSessionArgs);

		setDisplayExecutePopper(false);
	};

	const handleFunctionChange = (event: string) => {
		let entrypointForFunction;
		try {
			entrypointForFunction = JSON.parse(event);
		} catch (error) {
			console.error(error);
		}
		setSelectedEntrypoint(entrypointForFunction);
		setSelectedFunction(event);
	};

	const deletePopperEl = useRef<HTMLDivElement | null>(null);
	const deleteReferenceEl = useRef<HTMLDivElement | null>(null);
	const [showPopper, setShowPopper] = useState(false);
	const [deleteDeploymentId, setDeleteDeploymentId] = useState("");

	const { attributes: deleteAttributes, styles: deleteStyles } = usePopper(
		deleteReferenceEl.current,
		deletePopperEl.current,
		{
			placement: "bottom",
			modifiers: [
				{
					name: "offset",
					options: {
						offset: [0, 10],
					},
				},
			],
		}
	);
	const deletePopperClasses = cn(
		"flex-col z-30 bg-vscode-editor-background text-vscode-foreground",
		"border border-gray-300 p-4 rounded-lg shadow-lg",
		{ invisible: !showPopper }
	);

	const toggleDeletePopper = (refElement: HTMLDivElement | null, deploymentId: string, hidePopper?: boolean) => {
		if (hidePopper) {
			setShowPopper(false);
			return;
		}
		setDeleteDeploymentId(deploymentId);
		setShowPopper(!showPopper);
		referenceEl.current = refElement;
	};

	const deleteDeployment = () => {
		sendMessage(MessageType.deleteDeployment, deleteDeploymentId);
		setShowPopper(false);
	};

	return (
		deployments &&
		deployments.map((deployment: Deployment) => (
			<AKTableRow key={deployment.deploymentId} isSelected={selectedDeployment === deployment.deploymentId}>
				<AKTableCell onClick={() => getSessionsByDeploymentId(deployment.deploymentId)} classes={["cursor-pointer"]}>
					{getTimePassed(deployment.createdAt)}
				</AKTableCell>
				<AKTableCell onClick={() => getSessionsByDeploymentId(deployment.deploymentId)} classes={["cursor-pointer"]}>
					<div className="flex justify-center">
						<AKDeploymentState deploymentState={deployment.state} />
					</div>
				</AKTableCell>
				<AKTableCell onClick={() => getSessionsByDeploymentId(deployment.deploymentId)} classes={["cursor-pointer"]}>
					{getSessionStateCount(deployment, SessionStateType.running)}
				</AKTableCell>
				<AKTableCell onClick={() => getSessionsByDeploymentId(deployment.deploymentId)} classes={["cursor-pointer"]}>
					{getSessionStateCount(deployment, SessionStateType.error)}
				</AKTableCell>
				<AKTableCell onClick={() => getSessionsByDeploymentId(deployment.deploymentId)} classes={["cursor-pointer"]}>
					{getSessionStateCount(deployment, SessionStateType.completed)}
				</AKTableCell>
				<AKTableCell onClick={() => getSessionsByDeploymentId(deployment.deploymentId)} classes={["cursor-pointer"]}>
					{deployment.buildId}
				</AKTableCell>
				<AKTableCell>
					{deployment.deploymentId === deployments?.[0]?.deploymentId && (
						<div
							className="codicon codicon-redo mr-2 cursor-pointer"
							ref={referenceEl}
							title="Execute"
							onClick={() => togglePopper()}
						></div>
					)}
					{isDeploymentStateStartable(deployment.state) ? (
						<div
							className="codicon codicon-debug-start cursor-pointer text-green-500"
							onClick={() => activateBuild(deployment.deploymentId)}
						></div>
					) : (
						<div
							className="codicon codicon-debug-stop cursor-pointer text-red-500"
							onClick={() => deactivateBuild(deployment.deploymentId)}
						></div>
					)}

					<div
						className="codicon codicon-trash cursor-pointer ml-2"
						onClick={(e) => toggleDeletePopper(e.currentTarget, deployment.deploymentId)}
						ref={referenceEl}
					></div>

					<div
						ref={deletePopperEl}
						style={deleteStyles.popper}
						{...deleteAttributes.popper}
						className={deletePopperClasses}
					>
						<div className="mb-3 text-left">
							<strong className="mb-2">
								Are you sure you want to
								<br /> delete this deployment?
							</strong>
						</div>
						<div className="flex">
							<AKButton
								classes="bg-vscode-editor-background text-vscode-foreground"
								onClick={() => toggleDeletePopper(null, "", true)}
							>
								{translate().t("reactApp.general.no")}
							</AKButton>
							<div className="flex-grow" />
							<AKButton onClick={() => deleteDeployment()}>{translate().t("reactApp.general.yes")}</AKButton>
						</div>
					</div>
					{displayExecutePopper && (
						<div className="absolute w-screen h-screen" onClick={() => setDisplayExecutePopper(false)} />
					)}
					<div
						ref={popperEl}
						style={styles.popper}
						{...attributes.popper}
						className={cn(popperClasses, [{ invisible: !displayExecutePopper }])}
					>
						<div className="mb-3 text-left">
							<strong className="mb-2">{translate().t("reactApp.deployments.executeFile")}</strong>
							<VSCodeDropdown
								value={selectedFile}
								onChange={(e: any) => setSelectedFile(e.target.value)}
								className="flex"
							>
								{files &&
									Object.keys(files).map((file) => (
										<option key={file} value={file}>
											{file}
										</option>
									))}
							</VSCodeDropdown>
							{displayedErrors["triggerFile"] && <div className="text-red-500">Please choose trigger file</div>}
						</div>
						<div className="mb-3 text-left">
							<strong className="mb-2">{translate().t("reactApp.deployments.executeEntrypoint")}</strong>
							<VSCodeDropdown
								value={selectedFunction}
								onChange={(e: any) => handleFunctionChange(e.target.value)}
								disabled={functions !== undefined && functions.length <= 1}
								className="flex"
							>
								{functions &&
									functions.map((func) => (
										<option key={func.name} value={JSON.stringify(func)}>
											{func.name}
										</option>
									))}
							</VSCodeDropdown>
							{displayedErrors["triggerFunction"] && <div className="text-red-500">Please choose trigger function</div>}
						</div>
						<div className="flex">
							<AKButton
								classes="bg-vscode-editor-background text-vscode-foreground"
								onClick={() => setDisplayExecutePopper(false)}
							>
								{translate().t("reactApp.deployments.dismiss")}
							</AKButton>
							<div className="flex-grow" />
							<AKButton onClick={() => startSession()}>{translate().t("reactApp.deployments.saveAndRun")}</AKButton>
						</div>
					</div>
				</AKTableCell>
			</AKTableRow>
		))
	);
};
