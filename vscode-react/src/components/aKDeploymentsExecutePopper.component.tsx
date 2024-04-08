import React from "react";
import { translate } from "@i18n";
import { AKButton } from "@react-components/aKButton.component";
import { SessionEntrypoint } from "@type/models";
import { VSCodeDropdown } from "@vscode/webview-ui-toolkit/react";

interface ExecutePopperProps {
	files: Record<string, SessionEntrypoint[]>;
	functions: SessionEntrypoint[];
	selectedFile: string;
	selectedFunction: string;
	onFileChange: (file: string) => void;
	onFunctionChange: (func: string) => void;
	onStartSession: () => void;
	onClose: () => void;
	displayedErrors: Record<string, boolean>;
}

export const ExecutePopper: React.FC<ExecutePopperProps> = ({
	files,
	functions,
	selectedFile,
	selectedFunction,
	onFileChange,
	onFunctionChange,
	onStartSession,
	onClose,
	displayedErrors,
}) => {
	return (
		<div className="relative p-4shadow-lg">
			<div className="mb-3 text-left">
				<strong>{translate().t("reactApp.deployments.executeFile")}</strong>
				<VSCodeDropdown value={selectedFile} onChange={(e: any) => onFileChange(e.target.value)} className="flex">
					{Object.keys(files).map((file) => (
						<option key={file} value={file}>
							{file}
						</option>
					))}
				</VSCodeDropdown>
				{displayedErrors["selectedFile"] && <div className="text-red-500">Please choose a file</div>}
			</div>
			<div className="mb-3 text-left">
				<strong>{translate().t("reactApp.deployments.executeEntrypoint")}</strong>
				<VSCodeDropdown
					value={selectedFunction}
					onChange={(e: any) => onFunctionChange(e.target.value)}
					disabled={functions.length <= 1}
					className="flex"
				>
					{functions.map((func) => (
						<option key={func.name} value={JSON.stringify(func)}>
							{func.name}
						</option>
					))}
				</VSCodeDropdown>
				{displayedErrors["selectedFunction"] && <div className="text-red-500">Please choose a function</div>}
			</div>
			<div className="flex">
				<AKButton classes="bg-vscode-editor-background text-vscode-foreground" onClick={onClose}>
					{translate().t("reactApp.deployments.dismiss")}
				</AKButton>
				<div className="flex-grow" />
				<AKButton onClick={onStartSession}>{translate().t("reactApp.deployments.saveAndRun")}</AKButton>
			</div>
		</div>
	);
};
