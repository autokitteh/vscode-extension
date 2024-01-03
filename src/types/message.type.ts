import { MessageType } from "@enums";
import { SectionRowsRange } from "@type/interfaces";
import { Deployment, Project, Session } from "@type/models";
import { EntitySectionRowsRange } from "@type/views/webview";

export type Message = {
	type: MessageType;
	payload:
		| string
		| object
		| number
		| Deployment[]
		| Session[]
		| Project
		| SectionRowsRange
		| EntitySectionRowsRange;
};
