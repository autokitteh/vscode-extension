import { translate } from "@i18n";
import { Button } from "@react-components/atoms/button.component";
import { SessionEntrypoint } from "@type/models";
import { VSCodeDropdown } from "@vscode/webview-ui-toolkit/react";
import React, { MouseEvent } from "react";

interface ExecutePopperProps {
	displayedErrors: Record<string, boolean>;
	files: Record<string, SessionEntrypoint[]>;
	functions: SessionEntrypoint[];
	onClose: () => void;
	onFileChange: (file: string) => void;
	onFunctionChange: (func: string) => void;
	onStartSession: (event?: MouseEvent<HTMLElement>) => void;
	selectedFile: string;
	selectedFunction: string;
}

export const ExecutePopper: React.FC<ExecutePopperProps> = ({
	displayedErrors,
	files,
	functions,
	onClose,
	onFileChange,
	onFunctionChange,
	onStartSession,
	selectedFile,
	selectedFunction,
}) => {
	const onStartClick = (event: MouseEvent<HTMLElement> | undefined) => {
		event?.stopPropagation();
		onStartSession();
	};

	const onFileChangeClick = (event: any): void => {
		event.stopPropagation();
		onFileChange(event.target.value);
	};

	const onEntrypointClick = (event: any): void => {
		event.stopPropagation();
		onFunctionChange(event.target.value);
	};

	return (
		<div className="p-4shadow-lg relative" onClick={(event) => event.stopPropagation()}>
			<div className="mb-3 text-left">
				<strong>{translate().t("reactApp.deployments.executeFile")}</strong>
				<VSCodeDropdown className="flex" onChange={onFileChangeClick} value={selectedFile}>
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
				{functions ? (
					<VSCodeDropdown
						className="flex"
						disabled={!functions.length}
						onChange={onEntrypointClick}
						value={selectedFunction}
					>
						{functions.map((func) => (
							<option key={func.name} value={JSON.stringify(func)}>
								{func.name}
							</option>
						))}
					</VSCodeDropdown>
				) : (
					<VSCodeDropdown className="flex" disabled>
						<option>{translate().t("reactApp.deployments.executionFunctionsNotFound")}</option>
					</VSCodeDropdown>
				)}
				{displayedErrors["selectedFunction"] && <div className="text-red-500">Please choose a function</div>}
			</div>
			<div className="flex">
				<Button classes="bg-vscode-editor-background text-vscode-foreground" onClick={onClose}>
					{translate().t("reactApp.deployments.dismiss")}
				</Button>
				<div className="grow" />
				<Button onClick={onStartClick}>{translate().t("reactApp.deployments.saveAndRun")}</Button>
			</div>
		</div>
	);
};
