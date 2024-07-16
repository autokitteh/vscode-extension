import React from "react";

import { Editor } from "@monaco-editor/react";
import CloseIcon from "@react-assets/icons/close.svg?react";
import { Modal } from "@react-components/molecules";

export const MonacoEditorModal = ({ onClose, content }: { onClose: () => void; content?: string }) => (
	<Modal wrapperClasses={["!bg-transparent z-50"]} classes={["bg-black-semi-transparent", "rounded-none"]}>
		<div className="flex justify-end text-white font-extrabold pt-8 text-xl">
			<div className="flex justify-end pt-4">
				<CloseIcon fill="white" onClick={() => onClose()} className="w-4 p-0 cursor-pointer" />
			</div>
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
