import { MessageType } from "@enums";
import { translate } from "@i18n";
import { DownloadIcon } from "@react-assets/icons/download.icon";
import { TriggersIcon } from "@react-assets/icons/triggers.icon";
import { Button, Logo, Overlay } from "@react-components/atoms";
import { ConnectionsModal } from "@react-components/connections";
import { Popper } from "@react-components/molecules";
import { ProjectSettingsPopper } from "@react-components/project/organisms";
import { useAppDispatch, useAppState } from "@react-context";
import { useIncomingMessageHandler } from "@react-hooks";
import { cn, sendMessage } from "@react-utilities";
import { useEffect, useMemo, useRef, useState } from "react";

import "split-pane-react/esm/themes/default.css";

export const Header = () => {
	const [{ loading }] = useAppState();
	const [projectName, setProjectName] = useState<string>();
	const [resourcesDir, setResourcesDir] = useState<string>("");
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [settingsPopperVisible, setSettingsPopperVisible] = useState<boolean>(false);
	const pathPopperElementRef = useRef<HTMLDivElement | null>(null);
	const { startLoader, stopLoader } = useAppDispatch();
	const { setTheme } = useAppDispatch();

	const [connectionsModalVisible, setConnectionsModalVisible] = useState<boolean>(false);
	useIncomingMessageHandler({
		setProjectName,
		setResourcesDir,
		setTheme,
		startLoader,
		stopLoader,
	});

	const openConnectionsModal = () => {
		setConnectionsModalVisible(true);
		sendMessage(MessageType.fetchConnections);
	};

	const refreshUI = () => {
		setIsRefreshing(true);
		sendMessage(MessageType.refreshUI);
	};

	useEffect(() => {
		if (!isRefreshing || loading) {
			return;
		}

		const timeout = setTimeout(() => {
			setIsRefreshing(false);
		}, 600);

		return () => clearTimeout(timeout);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [loading]);

	const rotateIconClass = useMemo(
		() =>
			cn("codicon codicon-sync text-vscode-background animate-spin transition animation-paused", {
				// eslint-disable-next-line @typescript-eslint/naming-convention
				"animation-running": isRefreshing,
			}),
		[isRefreshing]
	);

	return (
		<div className="flex w-full items-center">
			<Logo className="m-2 size-9" />
			{/* eslint-disable tailwindcss/classnames-order */}
			<div className="text-vscode-input-foreground text-lg font-bold">{projectName}</div>
			<Button
				classes="mx-4"
				disabled={!resourcesDir}
				onClick={() => sendMessage(MessageType.buildProject)}
				title={translate().t("reactApp.general.build")}
			>
				<div className="codicon codicon-tools mr-2"></div>
				{translate().t("reactApp.general.build")}
			</Button>
			<Button
				disabled={!resourcesDir}
				onClick={() => sendMessage(MessageType.runProject)}
				title={translate().t("reactApp.general.deploy")}
			>
				<div className="codicon codicon-rocket mr-2"></div>
				{translate().t("reactApp.general.deploy")}
			</Button>
			<div className="grow"></div>
			<div className="flex flex-row">
				<Button
					classes="flex relative z-30 mr-2"
					disabled={isRefreshing}
					onClick={refreshUI}
					title={translate().t("reactApp.settings.refresh")}
				>
					<div className={rotateIconClass} />
				</Button>

				<Button
					onClick={() => sendMessage(MessageType.openTriggersWebUI)}
					classes="flex relative z-30 mr-2"
					title={translate().t("reactApp.settings.openTriggersSettingsScreen")}
				>
					<TriggersIcon className="fill-text-vscode-foreground mr-1 -ml-1" />
					{translate().t("reactApp.settings.headerTriggersButton")}
				</Button>

				<Button
					classes="flex relative z-30 mr-2"
					onClick={() => openConnectionsModal()}
					title={translate().t("reactApp.settings.openConnectionsSettingsScreen")}
				>
					<div className="codicon codicon-link text-vscode-background mr-1 -ml-1" />{" "}
					{translate().t("reactApp.settings.headerConnectionsButton")}
				</Button>
				{!resourcesDir ? (
					<Button
						classes="flex relative z-30"
						onClick={() => sendMessage(MessageType.onClickSetResourcesDirectory)}
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

				<Popper referenceRef={pathPopperElementRef} visible={settingsPopperVisible}>
					<ProjectSettingsPopper closePopper={() => setSettingsPopperVisible(false)} resourcesDir={resourcesDir} />
				</Popper>
			</div>
			{connectionsModalVisible && <ConnectionsModal onClose={() => setConnectionsModalVisible(false)} />}
		</div>
	);
};
