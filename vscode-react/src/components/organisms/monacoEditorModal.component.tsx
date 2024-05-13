import React from "react";
import { Editor } from "@monaco-editor/react";
import { Modal } from "@react-components/molecules";

export const MonacoEditorModal = ({ onCloseClicked, content }: { onCloseClicked: () => void; content?: string }) => (
	<Modal wrapperClasses={["!bg-transparent z-50"]} classes={["bg-black-semi-transparent", "rounded-none"]}>
		<div
			className="flex justify-end cursor-pointer text-white font-extrabold pt-8 text-xl"
			onClick={() => onCloseClicked()}
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
	</Modal>
);
