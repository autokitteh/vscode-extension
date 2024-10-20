import React, { MouseEvent, useState, useEffect, useCallback } from "react";

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
	const hasValidationErrors = inputParameters.some((param) => param.keyError || param.valueError);

	const validateParameters = useCallback(() => {
		setInputParameters((prevParams) =>
			prevParams.map((param) => ({
				...param,
				keyError:
					param.key.length === 0 ? translate().t("reactApp.deployments.inputParameters.errors.missingKey") : undefined,
				valueError:
					param.value.length === 0
						? translate().t("reactApp.deployments.inputParameters.errors.missingValue")
						: undefined,
			}))
		);
		return inputParameters.every((param) => !param.keyError && !param.valueError);
	}, [inputParameters]);

	const onStartClick = useCallback(
		(event?: MouseEvent<HTMLElement>) => {
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
		},
		[inputParameters, validateParameters, onStartSession]
	);

	const onFileChangeClick = useCallback(
		(event: Event | React.FormEvent<HTMLElement>): void => {
			event.stopPropagation();
			let target: HTMLSelectElement;

			if (event instanceof Event) {
				target = event.target as HTMLSelectElement;
			} else {
				target = event.currentTarget as HTMLSelectElement;
			}

			onFileChange(target.value);
		},
		[onFileChange]
	);

	const onFunctionNameChange = useCallback(
		(event: Event | React.FormEvent<HTMLElement>): void => {
			event.stopPropagation();
			let target: HTMLInputElement;

			if (event instanceof Event) {
				target = event.target as HTMLInputElement;
			} else {
				target = event.currentTarget as HTMLInputElement;
			}

			onFunctionChange(target.value);
		},
		[onFunctionChange]
	);

	const addParameter = useCallback(() => {
		if (validateParameters()) {
			setInputParameters((prevParams) => [...prevParams, { key: "", value: "" }]);
		}
	}, [validateParameters]);

	const removeParameter = useCallback((index: number) => {
		// eslint-disable-next-line @typescript-eslint/naming-convention
		setInputParameters((prevParams) => prevParams.filter((_, i) => i !== index));
	}, []);

	const updateParameter = useCallback(
		(index: number, field: "key" | "value", eventOrValue: Event | React.FormEvent<HTMLElement> | string) => {
			setInputParameters((prevParams) =>
				prevParams.map((param, i) => {
					if (i === index) {
						let value: string;
						if (typeof eventOrValue === "string") {
							value = eventOrValue;
						} else {
							const target = (
								eventOrValue instanceof Event ? eventOrValue.target : eventOrValue.currentTarget
							) as HTMLInputElement;
							value = target.value;
						}

						const updatedParam = { ...param, [field]: value };
						if (field === "key") {
							updatedParam.keyError =
								value.length === 0
									? translate().t("reactApp.deployments.inputParameters.errors.missingKey")
									: undefined;
						} else {
							updatedParam.valueError =
								value.length === 0
									? translate().t("reactApp.deployments.inputParameters.errors.missingValue")
									: undefined;
						}
						return updatedParam;
					}
					return param;
				})
			);
		},
		[]
	);

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
						<div key={`param-${index}`} className="flex flex-col mb-2">
							<div className="flex items-center">
								<VSCodeTextField
									value={param.key}
									onChange={(event) => updateParameter(index, "key", event)}
									placeholder="Key"
									className="mr-2"
									style={{ width: "calc(50% - 0.5rem)" }}
								/>
								<VSCodeTextField
									value={param.value}
									onChange={(event) => updateParameter(index, "value", event)}
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
