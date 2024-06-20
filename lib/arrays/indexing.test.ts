import { modulo } from "./indexing.js";

import * as fc from "fast-check";
import { describe, expect, it, test } from "vitest";

test("mod() is always positive", () => {
	fc.assert(
		fc.property(fc.integer(), fc.integer({ min: 1 }), (a, b) => {
			if (!isNaN(a) && !isNaN(b)) {
				expect(modulo(a, b)).toBeGreaterThanOrEqual(0);
			} else {
				expect(modulo(a, b)).toBe(Number.NaN);
			}
		}),
	);
});

test("mod() works with addition", () => {
	fc.assert(
		fc.property(
			fc.integer(),
			fc.integer(),
			fc.integer({ min: 1 }),
			(a: number, b: number, c) => {
				expect(modulo(a + b, c)).toBe(modulo(modulo(a, c) + modulo(b, c), c));
			},
		),
	);
});

describe("mod", () => {
	it("should return a number within the range of [0, m)", () => {
		fc.assert(
			fc.property(fc.integer(), fc.integer({ min: 1 }), (n, m) => {
				const result = modulo(n, m);
				expect(result).toBeGreaterThanOrEqual(0);
				expect(result).toBeLessThan(m);
			}),
		);
	});

	it("should return the same value when n > 0", () => {
		fc.assert(
			fc.property(fc.integer(), fc.integer({ min: 1 }), (n, m) => {
				expect(modulo(n, m)).toEqual(modulo(n + m, m));
			}),
		);
	});

	it("should perform efficiently", () => {
		const start = performance.now();
		fc.assert(
			fc.property(fc.integer(), fc.integer({ min: 1 }), (n, m) => {
				modulo(n, m);
			}),
		);
		const end = performance.now();
		expect(end - start).toBeLessThan(1000);
	});
});
