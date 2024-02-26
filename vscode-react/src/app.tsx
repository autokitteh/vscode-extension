import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { MessageType, Theme } from "@enums";
import { translate } from "@i18n";
import { Player } from "@lottiefiles/react-lottie-player";
import { DeploymentSectionViewModel } from "@models";
import { SessionSectionViewModel } from "@models/views";
import loaderAnimation from "@react-assets/media/catto-loader.json";
import { AKButton, AKLogo, AKModal } from "@react-components";
import { IIncomingMessagesHandler } from "@react-interfaces";
import { AKDeployments, AKSessions } from "@react-sections";
import { HandleIncomingMessages, sendMessage } from "@react-utilities";
import { cn } from "@react-utilities/cnClasses.utils";
import { Message } from "@type";
import "./app.css";
import { VSCodeDropdown } from "@vscode/webview-ui-toolkit/react";
import * as monaco from "monaco-editor";
import MonacoEditor from "react-monaco-editor";
import { usePopper } from "react-popper";

function App() {
	const [deploymentsSection, setDeploymentsSection] = useState<DeploymentSectionViewModel | undefined>();
	const [projectName, setProjectName] = useState<string | undefined>();
	const [themeVisualType, setThemeVisualType] = useState<Theme | undefined>();
	const [selectedDeploymentId, setSelectedDeploymentId] = useState<string | undefined>();
	const [resourcesDirState, setResourcesDirState] = useState<boolean>(false);
	const [entrypoints, setEntrypoints] = useState<Record<string, string[]> | undefined>();
	const [sessionsSection, setSessionsSection] = useState<SessionSectionViewModel | undefined>();
	const [code, setCode] = useState("// type your code...");
	const [modal, setModal] = useState(false);
	console.log("start");

	const messageHandlers: IIncomingMessagesHandler = {
		setDeploymentsSection,
		setProjectName,
		setThemeVisualType,
		setSessionsSection,
		setSelectedDeploymentId,
		setResourcesDirState,
		setEntrypoints,
	};

	const handleMessagesFromExtension = useCallback(
		(event: MessageEvent<Message>) => HandleIncomingMessages(event, messageHandlers),
		[]
	);

	useEffect(() => {
		window.addEventListener("message", handleMessagesFromExtension);
		return () => {
			window.removeEventListener("message", handleMessagesFromExtension);
		};
	}, [handleMessagesFromExtension]);

	const [files, setFiles] = useState<Record<string, string[]>>();
	const [selectedFile, setSelectedFile] = useState<string>("");
	const [functions, setFunctions] = useState<string[]>();
	const [selectedFunction, setSelectedFunction] = useState<string>("");

	useEffect(() => {
		if (files) {
			const functionsForSelectedFile = files[selectedFile];

			setFunctions(functionsForSelectedFile || []);
			setSelectedFunction(functionsForSelectedFile?.[0] || "");
		}
	}, [selectedFile]);

	useEffect(() => {
		if (entrypoints) {
			setFiles(entrypoints);
			setSelectedFile("http.star");
			setFunctions(entrypoints["http.star"]);
		}
	}, [entrypoints]);

	const editorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => setupPasteFormatting(editor);

	const setupPasteFormatting = (editor: monaco.editor.IStandaloneCodeEditor) => {
		editor.onDidPaste((e) => {
			const pastedContent = editor.getModel()?.getValueInRange(e.range);
			if (!pastedContent) {
				return;
			}
			const formattedContent = formatPastedContent(pastedContent);

			editor.executeEdits("", [
				{
					range: e.range,
					text: formattedContent,
					forceMoveMarkers: true,
				},
			]);

			setCode(formattedContent);
		});
	};

	const formatPastedContent = (content: string) => {
		return JSON.stringify(JSON.parse(content), null, 2);
	};

	const referenceEl = useRef<HTMLDivElement | null>(null);
	const popperEl = useRef<HTMLDivElement | null>(null);

	const { attributes } = usePopper(referenceEl.current, popperEl.current, {
		placement: "bottom",
		modifiers: [
			{
				name: "offset",
				options: {
					offset: [0, 10], // [skidding, distance]
				},
			},
		],
	});
	const [showPopper, setShowPopper] = useState(false);
	const togglePopper = () => setShowPopper(!showPopper);
	const centeredPopperStyles: CSSProperties = {
		position: "fixed",
		top: "5%",
		left: "31%",
		transform: "translate(-50%, 10%)",
		display: showPopper ? "flex" : "none",
		width: "45%",
		zIndex: 40,
	};

	return (
		<main>
			{!!projectName ? (
				<div className="flex flex-col w-full">
					<div className="flex items-center w-full">
						<AKLogo className="w-12 h-12" themeVisualType={themeVisualType} />
						<div className="text-vscode-input-foreground font-bold ml-4 text-lg">{projectName}</div>
						<AKButton
							classes="mx-4"
							onClick={() => sendMessage(MessageType.buildProject)}
							disabled={!resourcesDirState}
						>
							<div className="codicon codicon-tools mr-2"></div>
							{translate().t("reactApp.general.build")}
						</AKButton>
						<AKButton onClick={() => sendMessage(MessageType.runProject)} disabled={!resourcesDirState}>
							<div className="codicon codicon-rocket mr-2"></div>
							{translate().t("reactApp.general.deploy")}
						</AKButton>

						<div className="mx-4">|</div>

						<div
							ref={popperEl}
							style={centeredPopperStyles}
							{...attributes.popper}
							// eslint-disable-next-line max-len
							className="justify-between lg:flex-row bg-white text-black border border-gray-300 p-4 rounded-lg shadow-lg md:flex-col sm:flex-col max-sm:flex-col"
						>
							<div>
								File:
								<VSCodeDropdown
									value={selectedFile}
									onChange={(e: any) => setSelectedFile(e.target.value)}
									disabled={files !== undefined && Object.keys(files).length <= 1}
								>
									{files &&
										Object.keys(files).map((file) => (
											<option key={file} value={file}>
												{file}
											</option>
										))}
								</VSCodeDropdown>
							</div>
							<div>
								Entrypoint:
								<VSCodeDropdown
									value={selectedFunction}
									onChange={(e: any) => setSelectedFunction(e.target.value)}
									disabled={functions !== undefined && functions.length <= 1}
								>
									{functions &&
										functions.map((func) => (
											<option key={func} value={func}>
												{func}
											</option>
										))}
								</VSCodeDropdown>
							</div>
							<div>
								<div
									className="codicon codicon-symbol-namespace inline-block"
									ref={referenceEl}
									onClick={() => setModal(true)}
								></div>{" "}
								<div onClick={() => setModal(true)} className=" inline-block">
									{"{param1: 'test', param2: 'test'..."}
								</div>
							</div>
							<div>
								<AKButton onClick={() => togglePopper()}>Save</AKButton>
								<AKButton classes="bg-white text-black" onClick={() => togglePopper()}>
									Dismiss
								</AKButton>
							</div>
						</div>
						<AKButton classes="w-10 mr-2" onClick={togglePopper}>
							<div className="codicon codicon-edit mr-2" ref={referenceEl}></div>
						</AKButton>
						<AKButton onClick={() => sendMessage(MessageType.runSingleShot, code)} classes="mr-4">
							<div className="codicon codicon-send mr-2"></div>
							{translate().t("reactApp.general.singleShot")}
						</AKButton>
						<div className="flex-grow"></div>
						{!resourcesDirState && (
							<div className="mr-2">
								<strong>{translate().t("reactApp.settings.setLocalDirectory")} </strong>
							</div>
						)}
						<AKButton
							onClick={() => sendMessage(MessageType.onClickSetResourcesDirectory)}
							classes={cn(resourcesDirState ? "bg-gray-700" : "bg-red-700")}
							title={translate().t("reactApp.settings.pickDirectoryOfExecutables")}
						>
							<div className="codicon codicon-folder-opened w-4"></div>
						</AKButton>
					</div>
					{modal && (
						<AKModal>
							<div className="text-black text-xl">Session parameters</div>
							<div className="m-auto">
								<div className="flex w-fulljustify-end mt-2">
									<MonacoEditor
										language="json"
										height="50vh"
										width="100vw"
										theme="vs-dark"
										value={code}
										onChange={(value) => setCode(value)}
										editorDidMount={editorDidMount}
										className="z-50"
									/>
								</div>
								<div className="flex w-full justify-end mt-2">
									<AKButton classes="bg-gray-500" onClick={() => setModal(false)}>
										Dismiss
									</AKButton>
									<AKButton classes="ml-2" onClick={() => setModal(false)}>
										Update
									</AKButton>
								</div>
							</div>
						</AKModal>
					)}

					<AKDeployments
						deployments={deploymentsSection?.deployments}
						totalDeployments={deploymentsSection?.totalDeployments}
						selectedDeploymentId={selectedDeploymentId}
					/>
					<AKSessions sessions={sessionsSection?.sessions} totalSessions={sessionsSection?.totalSessions} />
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
