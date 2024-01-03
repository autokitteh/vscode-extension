import { EntitySectionRowsRange } from "@type/views/webview";

export type Callback = () => void;
export type ProjectCB = (projectId: string) => void;
export type CallbackWStringIdParam = (id: string) => void;
export type SectionRowsRangeCB = (value: EntitySectionRowsRange) => void;
export type SectionRowsRange = { startIndex: number; endIndex: number };
