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
}) => (
	<AKModal wrapperClasses={["pt-2", "!bg-transparent"]} classes={["bg-[#ffffff85]"]}>
		<div
			className="flex justify-end cursor-pointer text-black font-extrabold pt-8 text-xl"
			onClick={() => setModal(false)}
		>
			X
		</div>
		<div className="m-auto">
			<div className="flex w-full justify-end mt-2">
				<Editor
					height="80vh"
					defaultLanguage="json"
					defaultValue={content}
					theme="vs-dark"
					options={{ readOnly: true }}
				/>
			</div>
			<div className="flex w-full justify-end mt-2">
				<AKButton classes="w-full" onClick={() => setModal(false)}>
					{translate().t("reactApp.deployments.closeModalButton")}
				</AKButton>
			</div>
		</div>
	</AKModal>
);
