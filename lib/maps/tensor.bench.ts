import { Tensor } from "./tensor.js";

import { range } from "lodash-es";

import { bench } from "vitest";

bench(
	"inserts",
	() => {
		const tensor = new Tensor<{ x: number; y: number }, number>();
		const n = 1000;
		range(0, n).map((i) => tensor.assign({ x: i, y: i }, i));
	},
	{ iterations: 100 },
);
