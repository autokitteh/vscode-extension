import React, { MouseEvent, useState, useEffect } from "react";

import { translate } from "@i18n";
import { Button } from "@react-components/atoms/button.component";
import { VSCodeDropdown, VSCodeTextField } from "@vscode/webview-ui-toolkit/react";

interface ExecutePopperProps {
	files?: string[];
	functionName: string;
	selectedFile: string;
	onFileChange: (file: string) => void;
	onFunctionChange: (func: string) => void;
	onStartSession: (params: Record<string, string>) => void;
	onClose: () => void;
	displayedErrors: Record<string, boolean>;
}

interface ExecuteInputParameter {
	key: string;
	value: string;
	keyError?: string;
	valueError?: string;
}

export const ManualRunPopper = ({
	files,
	functionName,
	selectedFile,
	onFileChange,
	onFunctionChange,
	onStartSession,
	onClose,
	displayedErrors,
}: ExecutePopperProps) => {
	const [inputParameters, setInputParameters] = useState<ExecuteInputParameter[]>([]);
	const [hasValidationErrors, setHasValidationErrors] = useState(false);

	const validateParameters = () => {
		const updatedParams = inputParameters.map((param) => ({
			...param,
			keyError:
				param.key.length === 0 ? translate().t("reactApp.deployments.inputParameters.errors.missingKey") : undefined,
			valueError:
				param.value.length === 0
					? translate().t("reactApp.deployments.inputParameters.errors.missingValue")
					: undefined,
		}));
		setInputParameters(updatedParams);
		return updatedParams.every((param) => !param.keyError && !param.valueError);
	};

	useEffect(() => {
		setHasValidationErrors(inputParameters.some((param) => param.keyError || param.valueError));
	}, [inputParameters]);

	const onStartClick = (event: MouseEvent<HTMLElement> | undefined) => {
		event?.stopPropagation();
		if (validateParameters()) {
			const paramsObject = inputParameters.reduce(
				(acc, { key, value }) => {
					acc[key] = value;
					return acc;
				},
				{} as Record<string, string>
			);
			onStartSession(paramsObject);
		}
	};

	const onFileChangeClick = (event: any): void => {
		event.stopPropagation();
		onFileChange(event.target.value);
	};

	const onFunctionNameChange = (event: any): void => {
		event.stopPropagation();
		onFunctionChange(event.target.value);
	};

	const addParameter = () => {
		setInputParameters([...inputParameters, { key: "", value: "" }]);
	};

	const removeParameter = (index: number) => {
		// eslint-disable-next-line @typescript-eslint/naming-convention
		const updatedParams = inputParameters.filter((_, i) => i !== index);
		setInputParameters(updatedParams);
	};

	const updateParameter = (index: number, field: "key" | "value", value: string) => {
		const updatedParams = inputParameters.map((param, i) => {
			if (i === index) {
				const updatedParam = { ...param, [field]: value };
				if (field === "key") {
					updatedParam.keyError =
						value.length === 0 ? translate().t("reactApp.deployments.inputParameters.errors.missingKey") : undefined;
				} else {
					updatedParam.valueError =
						value.length === 0 ? translate().t("reactApp.deployments.inputParameters.errors.missingValue") : undefined;
				}
				return updatedParam;
			}
			return param;
		});
		setInputParameters(updatedParams);
	};

	const fullWidthStyle = {
		// eslint-disable-next-line @typescript-eslint/naming-convention
		"--vscode-inputbox-width": "100%",
	} as React.CSSProperties;

	useEffect(() => {
		const styleElement = document.createElement("style");
		styleElement.textContent = `
			vscode-text-field, vscode-dropdown {
			width: 100% !important;
			}
			vscode-text-field::part(root), vscode-dropdown::part(root) {
			width: 100% !important;
			}
			vscode-text-field::part(control), vscode-dropdown::part(control) {
			width: 100% !important;
			}
		`;
		document.head.appendChild(styleElement);

		return () => {
			document.head.removeChild(styleElement);
		};
	}, []);

	return (
		<div className="relative p-4 shadow-lg" onClick={(event) => event.stopPropagation()}>
			<div className="mb-3 text-left">
				<strong>{translate().t("reactApp.deployments.executeFile")}</strong>
				<VSCodeDropdown value={selectedFile} onChange={onFileChangeClick} className="flex">
					{files?.map((file) => (
						<option key={file} value={file}>
							{file}
						</option>
					))}
				</VSCodeDropdown>
				{displayedErrors["selectedFile"] && (
					<div className="text-red-500">{translate().t("reactApp.deployments.errors.missingFile")}</div>
				)}
			</div>
			<div className="mb-3 text-left w-full">
				<strong>{translate().t("reactApp.deployments.executeFunctionName")}</strong>
				<VSCodeTextField
					value={functionName}
					onChange={onFunctionNameChange}
					className="flex"
					style={fullWidthStyle}
				></VSCodeTextField>
				{displayedErrors["selectedFunction"] && (
					<div className="text-red-500">{translate().t("reactApp.deployments.errors.missingFunction")}</div>
				)}
			</div>
			<div className="mb-3 text-left w-full">
				<strong>{translate().t("reactApp.deployments.inputParameters.title")}</strong>
				<div>
					{inputParameters.map((param, index) => (
						<div key={index} className="flex flex-col mb-2">
							<div className="flex items-center">
								<VSCodeTextField
									value={param.key}
									onChange={(e: any) => updateParameter(index, "key", e.target.value)}
									placeholder="Key"
									className="mr-2"
									style={{ width: "calc(50% - 0.5rem)" }}
								/>
								<VSCodeTextField
									value={param.value}
									onChange={(e: any) => updateParameter(index, "value", e.target.value)}
									placeholder="Value"
									className="mr-2"
									style={{ width: "calc(50% - 0.5rem)" }}
								/>
								<Button onClick={() => removeParameter(index)}>
									{translate().t("reactApp.deployments.inputParameters.remove")}
								</Button>
							</div>
							{(param.keyError || param.valueError) && (
								<div className="text-red-500 mt-1">
									{param.keyError && <div>{param.keyError}</div>}
									{param.valueError && <div>{param.valueError}</div>}
								</div>
							)}
						</div>
					))}
					<Button onClick={addParameter}>{translate().t("reactApp.deployments.inputParameters.add")}</Button>
				</div>
			</div>
			<div>
				<div className="flex">
					<Button classes="bg-vscode-editor-background text-vscode-foreground" onClick={onClose}>
						{translate().t("reactApp.deployments.dismiss")}
					</Button>
					<div className="flex-grow" />
					<Button onClick={onStartClick} disabled={hasValidationErrors}>
						{translate().t("reactApp.deployments.execute")}
					</Button>
				</div>
				{hasValidationErrors && (
					<div className="text-red-500 mt-2">Please fix the errors in the input parameters before executing.</div>
				)}
			</div>
		</div>
	);
};
