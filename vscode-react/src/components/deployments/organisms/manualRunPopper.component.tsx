import { translate } from "@i18n";
import { Button } from "@react-components/atoms/button.component";
import { VSCodeDropdown, VSCodeTextField } from "@vscode/webview-ui-toolkit/react";
import React, { MouseEvent, useCallback, useEffect, useState } from "react";

interface ExecutePopperProps {
	displayedErrors: Record<string, boolean>;
	files?: string[];
	functionName: string;
	onClose: () => void;
	onFileChange: (file: string) => void;
	onFunctionChange: (func: string) => void;
	onStartSession: (params: Record<string, string>) => void;
	selectedFile: string;
}

interface ExecuteInputParameter {
	key: string;
	keyError?: string;
	value: string;
	valueError?: string;
}

export const ManualRunPopper = ({
	displayedErrors,
	files,
	functionName,
	onClose,
	onFileChange,
	onFunctionChange,
	onStartSession,
	selectedFile,
}: ExecutePopperProps) => {
	const [inputParameters, setInputParameters] = useState<ExecuteInputParameter[]>([]);
	const hasValidationErrors = inputParameters.some((param) => param.keyError || param.valueError);

	const validateParameters = useCallback(() => {
		setInputParameters((prevParams) =>
			prevParams.map((param) => ({
				...param,
				keyError: !param.key.length
					? translate().t("reactApp.deployments.inputParameters.errors.missingKey")
					: undefined,
				valueError: !param.value.length
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
							updatedParam.keyError = !value.length
								? translate().t("reactApp.deployments.inputParameters.errors.missingKey")
								: undefined;
						} else {
							updatedParam.valueError = !value.length
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
				<VSCodeDropdown className="flex" onChange={onFileChangeClick} value={selectedFile}>
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
			<div className="mb-3 w-full text-left">
				<strong>{translate().t("reactApp.deployments.executeFunctionName")}</strong>
				<VSCodeTextField
					className="flex"
					onChange={onFunctionNameChange}
					style={fullWidthStyle}
					value={functionName}
				></VSCodeTextField>
				{displayedErrors["selectedFunction"] && (
					<div className="text-red-500">{translate().t("reactApp.deployments.errors.missingFunction")}</div>
				)}
			</div>
			<div className="mb-3 w-full text-left">
				<strong>{translate().t("reactApp.deployments.inputParameters.title")}</strong>
				<div>
					{inputParameters.map((param, index) => (
						<div className="mb-2 flex flex-col" key={`param-${index}`}>
							<div className="flex items-center">
								<VSCodeTextField
									className="mr-2"
									onChange={(event) => updateParameter(index, "key", event)}
									placeholder="Key"
									style={{ width: "calc(50% - 0.5rem)" }}
									value={param.key}
								/>
								<VSCodeTextField
									className="mr-2"
									onChange={(event) => updateParameter(index, "value", event)}
									placeholder="Value"
									style={{ width: "calc(50% - 0.5rem)" }}
									value={param.value}
								/>
								<Button onClick={() => removeParameter(index)}>
									{translate().t("reactApp.deployments.inputParameters.remove")}
								</Button>
							</div>
							{(param.keyError || param.valueError) && (
								<div className="mt-1 text-red-500">
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
					<div className="grow" />
					<Button disabled={hasValidationErrors} onClick={onStartClick}>
						{translate().t("reactApp.deployments.execute")}
					</Button>
				</div>
				{hasValidationErrors && (
					<div className="mt-2 text-red-500">Please fix the errors in the input parameters before executing.</div>
				)}
			</div>
		</div>
	);
};
