export type ServiceResponse<ResponseType> = Promise<{
	data: ResponseType | undefined;
	error: object | undefined | unknown;
}>;
