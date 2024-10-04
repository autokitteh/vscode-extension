import React, { MouseEvent } from "react";

import { translate } from "@i18n";
import { Button } from "@react-components/atoms/button.component";
import { VSCodeDropdown, VSCodeTextField } from "@vscode/webview-ui-toolkit/react";

interface ExecutePopperProps {
	files: string[];
	functionName: string;
	selectedFile: string;
	onFileChange: (file: string) => void;
	onFunctionChange: (func: string) => void;
	onStartSession: (event?: MouseEvent<HTMLElement>) => void;
	onClose: () => void;
	displayedErrors: Record<string, boolean>;
}

export const ExecutePopper = ({
	files,
	functionName,
	selectedFile,
	onFileChange,
	onFunctionChange,
	onStartSession,
	onClose,
	displayedErrors,
}: ExecutePopperProps) => {
	const onStartClick = (event: MouseEvent<HTMLElement> | undefined) => {
		event?.stopPropagation();
		onStartSession();
	};

	const onFileChangeClick = (event: any): void => {
		event.stopPropagation();
		onFileChange(event.target.value);
	};

	const onFunctionNameChange = (event: any): void => {
		event.stopPropagation();
		onFunctionChange(event.target.value);
	};

	return (
		<div className="relative p-4shadow-lg" onClick={(event) => event.stopPropagation()}>
			<div className="mb-3 text-left">
				<strong>{translate().t("reactApp.deployments.executeFile")}</strong>
				<VSCodeDropdown value={selectedFile} onChange={onFileChangeClick} className="flex">
					{files.map((file) => (
						<option key={file} value={file}>
							{file}
						</option>
					))}
				</VSCodeDropdown>
				{displayedErrors["selectedFile"] && <div className="text-red-500">Please choose a file</div>}
			</div>
			<div className="mb-3 text-left">
				<strong>{translate().t("reactApp.deployments.executeEntrypoint")}</strong>
				<VSCodeTextField value={functionName} onChange={onFunctionNameChange} className="flex"></VSCodeTextField>
				{displayedErrors["selectedFunction"] && <div className="text-red-500">Please choose a function</div>}
			</div>
			<div className="flex">
				<Button classes="bg-vscode-editor-background text-vscode-foreground" onClick={onClose}>
					{translate().t("reactApp.deployments.dismiss")}
				</Button>
				<div className="flex-grow" />
				<Button onClick={onStartClick}>{translate().t("reactApp.deployments.saveAndRun")}</Button>
			</div>
		</div>
	);
};
