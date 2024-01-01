type Callback = () => void;
type ProjectCB = (projectId: string) => void;
type PageSize = { startIndex: number; endIndex: number };
type DeploymentPageSizeCB = ({ startIndex, endIndex }: PageSize) => void;
