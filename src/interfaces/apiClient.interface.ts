import { RequestConfig } from "@type";
import { AxiosRequestConfig } from "axios";

export interface IApiClient {
	post<TRequest, TResponse>(path: string, object: TRequest, config?: RequestConfig): Promise<TResponse>;
	patch<TRequest, TResponse>(path: string, object: TRequest): Promise<TResponse>;
	put<TRequest, TResponse>(path: string, object: TRequest): Promise<TResponse>;
	get<TResponse>(path: string): Promise<TResponse>;
}

export interface AxiosResponse<T = any> {
	data: T;
	status: number;
	statusText: string;
	headers: any;
	config: AxiosRequestConfig;
	request?: any;
}
