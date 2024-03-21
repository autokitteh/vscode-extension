// DeploymentContext.ts
import { createContext, Dispatch, SetStateAction } from "react";

type ExecutionDeploymentContextType = {
	lastDeployment: string | undefined;
	setLastDeployment: Dispatch<SetStateAction<string | undefined>>;
};

// Define an initial value. This value should match the type `DeploymentContextType`.
const initialValue: ExecutionDeploymentContextType = {
	lastDeployment: undefined,
	setLastDeployment: () => {}, // Provide a noop function as the initial setter
};

export const ExecutionDeploymentContext = createContext<ExecutionDeploymentContextType>(initialValue);
