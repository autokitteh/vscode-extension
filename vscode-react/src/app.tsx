import { useState } from "react";
import { AKHeader } from "@react-components";
import { AppStateProvider } from "@react-context";
import { AKDeployments, AKSessions } from "@react-sections";
import "./app.css";
import SplitPane from "split-pane-react";
import "split-pane-react/esm/themes/default.css";

function App() {
	const [sizes, setSizes] = useState<(number | string)[]>(["50%", "50%"]);
	return (
		<AppStateProvider>
			<main>
				<div className="flex flex-col w-full">
					<AKHeader />
					<div className="h-[calc(100vh-6vh)]">
						<SplitPane
							split="horizontal"
							sizes={sizes}
							onChange={setSizes}
							sashRender={() => <hr className="bg-vscode-editor-background h-3" />}
						>
							<div>
								<AKDeployments height={sizes[0]} />
							</div>
							<div>
								<AKSessions height={sizes[1]} />
							</div>
						</SplitPane>
					</div>
				</div>
			</main>
		</AppStateProvider>
	);
}

export default App;
