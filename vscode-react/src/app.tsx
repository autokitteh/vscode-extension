import { useEffect, useRef, useState } from "react";
import { MessageType } from "@enums";
import { DeploymentsSection } from "@react-components/deployments/pages";
import { Header } from "@react-components/organisms";
import { SessionsSection } from "@react-components/sessions/pages";
import { AppStateProvider } from "@react-context";
import { useIncomingMessageHandler } from "@react-hooks";
import { sendMessage } from "@react-utilities";
import "./app.css";
import SplitPane from "split-pane-react";
import "split-pane-react/esm/themes/default.css";

function App() {
	const [sizes, setSizes] = useState<(number | string)[]>([]);
	const [unreachableState, setUnreachableState] = useState<string>("");

	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (ref.current) {
			setSizes([ref.current.clientHeight * 0.48, ref.current.clientHeight * 0.48]);
		}
	}, []);

	useIncomingMessageHandler({
		setUnreachableState,
	});

	const reconnect = () => {
		sendMessage(MessageType.tryToReenable);
	};

	return (
		<AppStateProvider>
			<main ref={ref}>
				{unreachableState ? (
					<div
						className="flex bg-vscode-editor-background w-full h-[100vh] text-4xl justify-center items-center"
						onClick={() => reconnect()}
					>
						Unreachable
					</div>
				) : (
					<div className="flex flex-col w-full">
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
					</div>
				)}
			</main>
		</AppStateProvider>
	);
}

export default App;
