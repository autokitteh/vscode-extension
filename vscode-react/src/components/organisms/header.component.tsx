import { useRef, useState } from "react";
import { MessageType } from "@enums";
import { translate } from "@i18n";
import { DownloadIcon } from "@react-assets/icons/download.icon";
import { Button, Logo, Overlay } from "@react-components/atoms";
import { ConnectionsModal } from "@react-components/connections";
import { Popper } from "@react-components/molecules";
import { ProjectSettingsPopper } from "@react-components/project/organisms";
import { useAppDispatch } from "@react-context/appState.context";
import { useIncomingMessageHandler } from "@react-hooks";
import { sendMessage } from "@react-utilities";
import "split-pane-react/esm/themes/default.css";

export const Header = () => {
	const [projectName, setProjectName] = useState<string>();
	const [resourcesDir, setResourcesDir] = useState<string>("");
	const [settingsPopperVisible, setSettingsPopperVisible] = useState<boolean>(false);
	const pathPopperElementRef = useRef<HTMLDivElement | null>(null);
	const { stopLoader, startLoader } = useAppDispatch();
	const { setTheme } = useAppDispatch();

	const [connectionsModalVisible, setConnectionsModalVisible] = useState<boolean>(false);
	useIncomingMessageHandler({
		stopLoader,
		startLoader,
		setProjectName,
		setResourcesDir,
		setTheme,
	});

	const openConnectionsModal = () => {
		setConnectionsModalVisible(true);
		sendMessage(MessageType.fetchConnections);
	};

	const refreshUI = () => {
		sendMessage(MessageType.refreshUI);
	};

	return (
		<div className="flex items-center w-full">
			<Logo className="w-9 h-9 m-2" />
			<div className="text-vscode-input-foreground font-bold text-lg">{projectName}</div>
			<Button
				classes="mx-4"
				onClick={() => sendMessage(MessageType.buildProject)}
				disabled={!resourcesDir}
				title={translate().t("reactApp.general.build")}
			>
				<div className="codicon codicon-tools mr-2"></div>
				{translate().t("reactApp.general.build")}
			</Button>
			<Button
				onClick={() => sendMessage(MessageType.runProject)}
				disabled={!resourcesDir}
				title={translate().t("reactApp.general.deploy")}
			>
				<div className="codicon codicon-rocket mr-2"></div>
				{translate().t("reactApp.general.deploy")}
			</Button>
			<div className="flex-grow"></div>
			<div className="flex flex-row">
				<Button
					onClick={refreshUI}
					classes="flex relative z-30 mr-2"
					title={translate().t("reactApp.settings.refresh")}
				>
					<div className="codicon codicon-sync text-vscode-background mr-1" />{" "}
					{translate().t("reactApp.settings.refresh")}
				</Button>
				<Button
					onClick={() => openConnectionsModal()}
					classes="flex relative z-30 mr-2"
					title={translate().t("reactApp.settings.openConnectionsSettingsScreen")}
				>
					<div className="codicon codicon-link text-vscode-background mr-1" />{" "}
					{translate().t("reactApp.settings.headerConnectionsButton")}
				</Button>
				{!resourcesDir ? (
					<Button
						onClick={() => sendMessage(MessageType.onClickSetResourcesDirectory)}
						classes="flex relative z-30"
						title={translate().t("reactApp.settings.pickDirectoryOfExecutables")}
					>
						<DownloadIcon className="fill-text-vscode-foreground" />
					</Button>
				) : (
					<Button
						onClick={() => setSettingsPopperVisible(true)}
						title={translate().t("reactApp.settings.viewProjectSettings")}
					>
						<div className="codicon codicon-gear text-vscode-background" ref={pathPopperElementRef}></div>
					</Button>
				)}
				<Overlay isVisibile={settingsPopperVisible} onOverlayClick={() => setSettingsPopperVisible(false)} />

				<Popper visible={settingsPopperVisible} referenceRef={pathPopperElementRef}>
					<ProjectSettingsPopper resourcesDir={resourcesDir} closePopper={() => setSettingsPopperVisible(false)} />
				</Popper>
			</div>
			{connectionsModalVisible && <ConnectionsModal onClose={() => setConnectionsModalVisible(false)} />}
		</div>
	);
};
