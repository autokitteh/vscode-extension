import React from "react";
import { Editor } from "@monaco-editor/react";
import { AKModal } from "@react-components";

export const AKMonacoEditorModal = ({
	setModal,
	content,
}: {
	setModal: (isDisplayed: boolean) => void;
	content?: string;
}) => (
	<AKModal wrapperClasses={["!bg-transparent"]} classes={["bg-[#00000050]", "rounded-none"]}>
		<div
			className="flex justify-end cursor-pointer text-white font-extrabold pt-8 text-xl"
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
		</div>
	</AKModal>
);
