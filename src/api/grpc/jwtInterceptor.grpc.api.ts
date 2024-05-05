import { Interceptor } from "@connectrpc/connect";

function getJWTToken(): string | null {
	return "123";
}

export const jwtInterceptor: Interceptor = (next) => async (req) => {
	const token = getJWTToken();
	if (token) {
		req.header.set("Authorization", `Bearer ${token}`);
	}
	return await next(req);
};
