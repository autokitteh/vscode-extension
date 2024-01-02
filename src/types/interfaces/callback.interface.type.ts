import { PaginationListEntity } from "@enums";

export type Callback = () => void;
export type ProjectCB = (projectId: string) => void;
export type CallbackWStringIdParam = (id: string) => void;
export type PageSizeCB = (value: EntityPageSize) => void;
export type PageSize = { startIndex: number; endIndex: number };
export type EntityPageSize = { startIndex: number; endIndex: number; entity: PaginationListEntity };
