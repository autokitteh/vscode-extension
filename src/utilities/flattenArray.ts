import { get } from "lodash";

// TODO: refactor
export const flattenArray = <Type>(arr: any, propertyName: string): Type[] =>
	arr.reduce((prev: Type[], curr: Type) => {
		const currentArr = get(curr, propertyName);
		return prev.concat(currentArr);
	}, []);
