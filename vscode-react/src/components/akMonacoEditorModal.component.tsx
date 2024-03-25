import React from "react";
import { translate } from "@i18n";
import { Editor } from "@monaco-editor/react";
import { AKButton, AKModal } from "@react-components";

export const AKMonacoEditorModal = ({
	setModal,
	content,
}: {
	setModal: (isDisplayed: boolean) => void;
	content?: string;
}) => {
	return (
		<AKModal>
			<div className="flex justify-end cursor-pointer" onClick={() => setModal(false)}>
				X
			</div>
			<div className="m-auto">
				<div className="flex w-full justify-end mt-2">
					<Editor
						height="90vh"
						defaultLanguage="json"
						defaultValue={content ? JSON.stringify(content, null, 2) : ""}
						theme="vs-dark"
						options={{ readOnly: true }}
					/>
				</div>
				<div className="flex w-full justify-end mt-2">
					<AKButton classes="ml-2" onClick={() => setModal(false)}>
						{translate().t("reactApp.deployments.closeModalButton")}
					</AKButton>
				</div>
			</div>
		</AKModal>
	);
};
