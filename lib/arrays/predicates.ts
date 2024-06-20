import { sum, union } from "lodash-es";

// import union from "lodash-es/union";

export const disjoint = <ValueType>(arrays: ValueType[][]): boolean =>
	union<ValueType>(...arrays).length === sum(arrays.map((set) => set.length));
