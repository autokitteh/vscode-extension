import React from "react";
import { translate } from "@i18n";
import { Editor } from "@monaco-editor/react";
import { Button, Modal } from "@react-components";

export const MonacoEditorModal = ({
	setModal,
	content,
}: {
	setModal: (isDisplayed: boolean) => void;
	content?: string;
}) => (
	<Modal wrapperClasses={["pt-20 bg-black bg-opacity-70"]}>
		<div className="flex justify-end cursor-pointer" onClick={() => setModal(false)}>
			X
		</div>
		<div className="m-auto">
			<div className="flex w-full justify-end mt-2">
				<Editor
					height="70vh"
					defaultLanguage="json"
					defaultValue={content}
					theme="vs-dark"
					options={{ readOnly: true }}
				/>
			</div>
			<div className="flex w-full justify-end mt-2">
				<Button classes="ml-2" onClick={() => setModal(false)}>
					{translate().t("reactApp.deployments.closeModalButton")}
				</Button>
			</div>
		</div>
	</Modal>
);
