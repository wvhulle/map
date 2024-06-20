/* eslint-disable @typescript-eslint/no-explicit-any */
import { isEqual } from "@wvhulle/serializable";

import type { Pair_Stream } from "./hash_map.js";
import type { RecursiveMap } from "./recursive_map.js";
import { Tensor } from "./tensor.js";

import { assert, beforeEach, describe, expect, it } from "vitest";

it("correct hash", () => {
	const tensor = new Tensor<{ x: number; y: number }, string>();
	tensor.assign({ x: 1, y: 1 }, "top-left");
	tensor.assign({ x: 2, y: 1 }, "top-right");

	tensor.assign({ x: 1, y: 2 }, "bottom-left");

	tensor.assign({ x: 2, y: 2 }, "bottom-right");
	const firstRow = tensor.get_coordinate("x", 1);
	expect(firstRow.hash({ x: 1, y: 1 })).toBe('{"y":1}');
});

it("updates happen correctly", () => {
	const tensor = new Tensor<{ x: number; y: number }, string>();
	tensor.assign({ x: 1, y: 1 }, "top-left");
	tensor.assign({ x: 2, y: 1 }, "top-right");

	tensor.assign({ x: 1, y: 2 }, "bottom-left");

	const firstRow = tensor.get_coordinate("x", 2);
	let found: Pair_Stream<{ x: number; y: number }, string> | undefined;
	firstRow.subscribe(
		(row) =>
			(found = row.find((corner) => isEqual(corner.key, { x: 2, y: 2 }))),
	);
	expect(firstRow.size).to.be.eq(1);
	assert(
		(found as unknown) === undefined,
		"The first row should not be complete yet.",
	);

	tensor.assign({ x: 2, y: 2 }, "bottom-right");
	assert(
		(found as unknown) !== undefined,
		"The first row should be complete now.",
	);
	expect(found?.key).to.be.toStrictEqual({ x: 2, y: 2 });
	expect(firstRow.size).to.be.eq(2);
});

describe("adding", () => {
	let tensor: Tensor<{ x: number; y: number }, string>;
	beforeEach(() => {
		tensor = new Tensor();
		tensor.assign({ x: 1, y: 1 }, "top-left");
		tensor.assign({ x: 2, y: 1 }, "top-right");

		tensor.assign({ x: 1, y: 2 }, "bottom-left");

		tensor.assign({ x: 2, y: 2 }, "bottom-right");
	});
	describe("top-level", () => {
		it("size", () => {
			expect(tensor.size).toStrictEqual(4);
		});
	});

	describe("subspaces", () => {
		it("existence", () => {
			const firstRow = tensor.get_coordinate("x", 1);
			expect(firstRow).to.be.toBeDefined();
		});

		it("size", () => {
			expect(tensor.get_coordinate("x", 1).size).toStrictEqual(2);
		});

		it("exact values", () => {
			const firstRow = tensor.get_coordinate("x", 1);

			assert(firstRow);
			expect([...firstRow.values()]).toStrictEqual(["top-left", "bottom-left"]);
		});
	});
});

// describe('adding to subspace adds in top space', () => {
// 	let tensor: Tensor<{ x: number; y: number }, string>;
// 	beforeAll(() => {
// 		tensor = new Tensor();
// 		tensor.assign({ x: 1, y: 1 }, 'top-left');
// 		tensor.assign({ x: 2, y: 1 }, 'top-right');

// 		tensor.assign({ x: 1, y: 2 }, 'bottom-left');
// 	});

// 	test('add bottom right', () => {
// 		const projection = tensor.getProjection('y', 2);

// 		projection.assign({ x: 2 }, 'bottom-right');

// 		expect(tensor.getOrThrowValueByKey({ x: 2, y: 2 })).toStrictEqual('bottom-right');
// 	});
// });

describe("deleting", () => {
	let tensor: Tensor<{ x: number; y: number }, string>;
	let projection:
		| RecursiveMap<{ x: number; y: number }, string, any, any, "x">
		| undefined;
	beforeEach(() => {
		tensor = new Tensor();
		tensor.assign({ x: 1, y: 1 }, "top-left");
		tensor.assign({ x: 2, y: 1 }, "top-right");

		tensor.assign({ x: 1, y: 2 }, "bottom-left");

		tensor.assign({ x: 2, y: 2 }, "bottom-right");
		projection = tensor.get_coordinate("x", 1);
	});

	describe("from parent", () => {
		describe("whole row", () => {
			it("size", () => {
				assert(projection);
				tensor.remove_pairs_by_coordinates("x", 1);

				assert(projection);
				expect([...projection.values()]).to.have.length(0);
			});
		});

		describe("one node", () => {
			it("updates the existing values", () => {
				tensor.remove_pairs_by_keys({ x: 1, y: 1 });
				assert(projection);
				expect([...projection.values()]).toStrictEqual(["bottom-left"]);
			});

			it("updates the reactive sizes", () => {
				tensor.remove_pairs_by_keys({ x: 1, y: 1 });
				assert(projection);
				expect(projection.size).to.be.eq(1);

				expect(tensor.size).to.be.eq(3);
			});
		});
	});

	describe("from subspace", () => {
		describe("one node", () => {
			it("also deletes in parent space", () => {
				assert(projection);

				projection.remove_pairs_by_keys({ y: 1 });

				expect(projection.size).to.be.eq(1);

				expect(tensor.size).to.be.eq(3);
			});
		});
	});
});
