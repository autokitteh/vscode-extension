// DeploymentContext.ts
import { createContext, Dispatch, SetStateAction } from "react";
import { Deployment } from "@type/models";

type SessionStartContextType = {
	lastDeployment: Deployment | undefined;
	setLastDeployment: Dispatch<SetStateAction<Deployment | undefined>>;
};

// Define an initial value. This value should match the type `SessionStartContextType`.
const initialValue: SessionStartContextType = {
	lastDeployment: undefined,
	setLastDeployment: () => {}, // Provide a noop function as the initial setter
};

export const SessionStartContext = createContext<SessionStartContextType>(initialValue);
