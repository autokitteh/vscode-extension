export type Callback = () => void;
export type ProjectCB = (projectId: string) => void;
export type CallbackWStringIdParam = (id: string) => void;
export type PageSizeCB = (value: PageSize) => void;
export type PageSize = { startIndex: number; endIndex: number };
