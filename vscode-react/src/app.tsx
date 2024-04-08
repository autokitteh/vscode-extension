import { useEffect, useRef, useState } from "react";
import { MessageType, Theme } from "@enums";
import { translate } from "@i18n";
import { Player } from "@lottiefiles/react-lottie-player";
import DownloadIcon from "@react-assets/icons/download.svg?react";
import loaderAnimation from "@react-assets/media/catto-loader.json";
import { AKButton, AKLogo, PopperComponent } from "@react-components";
import { AppStateProvider } from "@react-context";
import { useIncomingMessageHandler } from "@react-hooks";
import { AKDeployments, AKSessions } from "@react-sections";
import { sendMessage } from "@react-utilities";
import "./app.css";

function App() {
	const [projectName, setProjectName] = useState<string | undefined>();
	const [themeVisualType, setThemeVisualType] = useState<Theme | undefined>();
	const [resourcesDir, setResourcesDir] = useState<string>("");
	const [pathResponse, setPathResponse] = useState<boolean>(false);
	const [resourcesDirPopperVisible, setResourcesDirPopperVisible] = useState<boolean>(false);
	const pathPopperElementRef = useRef<HTMLDivElement | null>(null);

	useIncomingMessageHandler({
		setProjectName,
		setThemeVisualType,
		setResourcesDir,
		setPathResponse,
	});

	useEffect(() => {
		setResourcesDirPopperVisible(false);
	}, [pathResponse, resourcesDir]);

	return (
		<main>
			{!!projectName ? (
				<div className="flex flex-col w-full">
					<div className="flex items-center w-full">
						<AKLogo className="w-12 h-12" themeVisualType={themeVisualType} />
						<div className="text-vscode-input-foreground font-bold ml-4 text-lg">{projectName}</div>
						<AKButton classes="mx-4" onClick={() => sendMessage(MessageType.buildProject)} disabled={!resourcesDir}>
							<div className="codicon codicon-tools mr-2"></div>
							{translate().t("reactApp.general.build")}
						</AKButton>
						<AKButton onClick={() => sendMessage(MessageType.runProject)} disabled={!resourcesDir}>
							<div className="codicon codicon-rocket mr-2"></div>
							{translate().t("reactApp.general.deploy")}
						</AKButton>
						<div className="flex-grow"></div>
						<div className="flex-col">
							{!resourcesDir ? (
								<AKButton
									onClick={() => sendMessage(MessageType.onClickSetResourcesDirectory)}
									classes="flex bg-transparent"
									title={translate().t("reactApp.settings.pickDirectoryOfExecutables")}
								>
									<DownloadIcon className="text-[#FDE767]" />
								</AKButton>
							) : (
								<AKButton classes="flex bg-transparent" onClick={() => setResourcesDirPopperVisible(true)}>
									<div className="codicon codicon-info" ref={pathPopperElementRef}></div>
								</AKButton>
							)}
							{resourcesDirPopperVisible && (
								<div
									className="absolute h-screen w-screen top-0 left-0 z-10"
									onClick={() => setResourcesDirPopperVisible(false)}
								></div>
							)}
							<PopperComponent visible={resourcesDirPopperVisible} referenceRef={pathPopperElementRef}>
								<div className="relative shadow-lg">
									<div className="mb-3 text-left">
										<div>Project path:</div>
										<strong>{resourcesDir}</strong>
									</div>
									<div className="flex">
										<AKButton
											onClick={() => sendMessage(MessageType.copyProjectPath, resourcesDir)}
											classes="bg-transparent"
											title={translate().t("reactApp.settings.copyPath")}
										>
											<div className="codicon codicon-copy"></div>
										</AKButton>
										<div className="flex-grow"></div>
										<AKButton
											onClick={() => sendMessage(MessageType.onClickSetResourcesDirectory)}
											classes="bg-transparent"
											title={translate().t("reactApp.settings.pickDirectoryOfExecutables")}
										>
											<DownloadIcon className="text-[#FDE767]" />
										</AKButton>
									</div>
								</div>
							</PopperComponent>
						</div>
					</div>
					<AppStateProvider>
						<AKDeployments />
						<AKSessions />
					</AppStateProvider>
				</div>
			) : (
				<div className="flex justify-center items-center h-screen w-screen">
					<Player src={loaderAnimation} className="player" loop autoplay />
				</div>
			)}
		</main>
	);
}

export default App;
