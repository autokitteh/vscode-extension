import { Editor } from "@monaco-editor/react";
import CloseIcon from "@react-assets/icons/close.svg?react";
import { Modal } from "@react-components/molecules";
import React from "react";

export const MonacoEditorModal = ({ content, onClose }: { content?: string; onClose: () => void }) => (
	<Modal classes={["bg-black-semi-transparent", "rounded-none"]} wrapperClasses={["!bg-transparent z-50"]}>
		<div className="flex justify-end pt-8 text-xl font-extrabold text-white">
			<div className="flex justify-end pt-4">
				<CloseIcon className="w-4 cursor-pointer p-0" fill="white" onClick={() => onClose()} />
			</div>
		</div>
		<div className="m-auto">
			<div className="mt-2 flex w-full justify-end">
				<Editor
					defaultLanguage="json"
					defaultValue={content}
					height="80vh"
					options={{ readOnly: true }}
					theme="vs-dark"
				/>
			</div>
		</div>
	</Modal>
);
