export type Connection = {
	name: string;
	parentId: string;
	connectionId: string;
	integrationId: string;
};

export type Value = {
	function?: {
		name?: string;
		argNames?: string[];
		doc?: string;
	};
	string?: {
		v: string;
	};
	integer?: {
		v: number;
	};
};
