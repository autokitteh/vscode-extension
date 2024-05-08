import { useRef, useState } from "react";
import { MessageType, Theme } from "@enums";
import { translate } from "@i18n";
import DownloadIcon from "@react-assets/icons/download.svg?react";
import { AKConnectionsModal } from "@react-components/aKConnectionsModal.component";
import { Button, Logo, Overlay } from "@react-components/atoms";
import { Popper } from "@react-components/molecules";
import { ProjectSettingsPopper } from "@react-components/project/organisms";
import { useAppDispatch } from "@react-context/appState.context";
import { useIncomingMessageHandler } from "@react-hooks";
import { sendMessage } from "@react-utilities";
import "split-pane-react/esm/themes/default.css";
import { Connection } from "@type/models";

export const Header = () => {
	const [projectName, setProjectName] = useState<string>();
	const [themeVisualType, setThemeVisualType] = useState<Theme | undefined>();
	const [resourcesDir, setResourcesDir] = useState<string>("");
	const [settingsPopperVisible, setSettingsPopperVisible] = useState<boolean>(false);
	const pathPopperElementRef = useRef<HTMLDivElement | null>(null);
	const [connections, setConnections] = useState<Connection[]>([]);
	const { stopLoader, startLoader } = useAppDispatch();
	const [connectionsModalVisible, setConnectionsModalVisible] = useState<boolean>(false);
	useIncomingMessageHandler({
		stopLoader,
		startLoader,
		setProjectName,
		setThemeVisualType,
		setResourcesDir,
		setConnections,
	});

	return (
		<div className="flex items-center w-full">
			<Logo className="w-9 h-9 m-2" themeVisualType={themeVisualType} />
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
				<AKButton
					onClick={() => setConnectionsModalVisible(true)}
					classes="flex relative z-30 mr-2"
					title={translate().t("reactApp.settings.openConnectionsSettingsScreen")}
				>
					<div className="codicon codicon-link text-vscode-background mr-1" /> Connections
				</AKButton>
				{!resourcesDir ? (
					<Button
						onClick={() => sendMessage(MessageType.onClickSetResourcesDirectory)}
						classes="flex relative z-30"
						title={translate().t("reactApp.settings.pickDirectoryOfExecutables")}
					>
						<DownloadIcon className="text-vscode-background" />
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
			{connectionsModalVisible && (
				<AKConnectionsModal connections={connections} onCloseClicked={() => setConnectionsModalVisible(false)} />
			)}
		</div>
	);
};
