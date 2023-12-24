import { Deployment } from "@ak-proto-ts/deployments/v1/deployment_pb";
import { ActivateResponse } from "@ak-proto-ts/deployments/v1/svc_pb";
import { Env } from "@ak-proto-ts/envs/v1/env_pb";
import { Project } from "@ak-proto-ts/projects/v1/project_pb";
import { Session } from "@ak-proto-ts/sessions/v1/session_pb";
import { User } from "@ak-proto-ts/users/v1/user_pb";

export type ServiceResponse = Promise<{
	data:
		| Deployment
		| Deployment[]
		| Project
		| Project[]
		| Session
		| Session[]
		| Env
		| Env[]
		| User
		| User[]
		| ActivateResponse
		| string
		| undefined;
	error: object | undefined | unknown;
}>;
