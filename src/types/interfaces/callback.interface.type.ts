export type Callback<T = void> = T extends void ? () => void : (arg: T) => void;
export type CallbackBoolean = (arg: boolean) => void;
export type SectionRowsRange = { startIndex: number; endIndex: number };
