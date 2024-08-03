import React, { useEffect, useRef, useState } from "react";

import LottieLoader from "react-lottie-loader";
import { HashRouter, Route, Routes, Link, Outlet } from "react-router-dom";
import SplitPane from "split-pane-react";

import { MessageType } from "@enums";
import retryLoader from "@react-assets/animations/retry-loader.json";
import { Overlay } from "@react-components/atoms";
import { DeploymentsSection } from "@react-components/deployments/pages";
import { Header } from "@react-components/organisms";
import { SessionLogViewer } from "@react-components/sessions/logs";
import { SessionsSection } from "@react-components/sessions/pages";
import { AppStateProvider } from "@react-context";
import { useIncomingMessageHandler } from "@react-hooks";
import { sendMessage } from "@react-utilities";
import "./app.css";
import "split-pane-react/esm/themes/default.css";
import "react-toggle/style.css";

const MainLayout = () => {
	const [sizes, setSizes] = useState<(number | string)[]>([]);
	const ref = useRef<HTMLDivElement>(null);

	console.log("MainLayout Rendered");

	useEffect(() => {
		if (ref.current) {
			setSizes([ref.current.clientHeight * 0.48, ref.current.clientHeight * 0.48]);
		}
	}, []);

	return (
		<div className="flex flex-col w-full h-full">
			<Link to="/session-log/1">Session Log</Link>
			<Header />
			<div className="h-[calc(100vh-6vh)]">
				<SplitPane
					split="horizontal"
					sizes={sizes}
					onChange={setSizes}
					sashRender={() => <hr className="bg-vscode-editor-background h-3" />}
				>
					<div>
						<DeploymentsSection height={sizes[0]} />
					</div>
					<div>
						<SessionsSection height={sizes[1]} />
					</div>
				</SplitPane>
			</div>
			<Outlet />
		</div>
	);
};

function App() {
	const [retryCountdown, setRetryCountdown] = useState<string>("");

	const reconnect = () => {
		sendMessage(MessageType.tryToReconnect);
	};

	const overlayClass = "relative flex flex-col w-[100vw] h-[100vh] text-4xl justify-center items-center z-50";

	useIncomingMessageHandler({
		setRetryCountdown,
	});

	return (
		<AppStateProvider>
			<HashRouter>
				<main>
					{retryCountdown ? (
						<div className="absolute" onClick={() => reconnect()}>
							<Overlay isVisibile className="opacity-65 z-40!" />
							<div className={overlayClass}>
								<div className="flex">
									<LottieLoader animationData={retryLoader} className="w-48 h-48" />
								</div>
								<div className="flex text-white font-light text-sm">Reconnecting in {retryCountdown}</div>
								<div className="flex text-white text-sm">Retry Now</div>
							</div>
						</div>
					) : null}
					<Routes>
						<Route path="/" element={<MainLayout />} />
						<Route path="session-log/:sessionId" element={<SessionLogViewer />} />
					</Routes>
				</main>
			</HashRouter>
		</AppStateProvider>
	);
}

export default App;
