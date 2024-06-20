import { TopologicalGraph } from "./topological_graph.js";

import { range } from "lodash-es";

import { bench, expect } from "vitest";

bench(
	"speed graph",
	() => {
		const graph = new TopologicalGraph<number, number>();
		const n = 20;
		range(0, n).map((i) => graph.assign(i, i));
		for (let i = 0; i < n; i++) {
			for (let j = 0; j < n; j++) {
				const r = Math.random();
				if (r > 0.25) {
					graph.connect_nodes_by_key(i, j);
				}
			}
		}

		expect(graph.shortest_path_between_keys(1, n - 1)).to.be.toBeDefined();
	},
	{ iterations: 100 },
);
