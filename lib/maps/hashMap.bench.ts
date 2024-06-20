import { HashMap } from "./hash_map.js";

import { range } from "lodash-es";

import { bench } from "vitest";

bench(
	"inserts",
	() => {
		const hashMap = new HashMap<number, number>();
		const n = 1000;
		range(0, n).map((i) => hashMap.assign(i, i));
		// for (let i = 0; i < n; i++) {
		// 	for (let j = 0; j < n; j++) {
		// 		const r = Math.random();
		// 		if (r > 0.25) {
		// 			graph.linkByKey(i, j);
		// 		}
		// 	}
		// }

		// expect(graph.shortestPathByKeys(1, n - 1)).to.be.toBeDefined();
	},
	{ iterations: 100 },
);
