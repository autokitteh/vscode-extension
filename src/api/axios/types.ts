import { AxiosRequestConfig } from "axios";

export interface AxiosResponse<T = any> {
	data: T;
	status: number;
	statusText: string;
	headers: any;
	config: AxiosRequestConfig;
	request?: any;
}
