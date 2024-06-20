import { Stream_of_Sets } from "./stream_of_sets.js";

import { expect, it } from "vitest";

const create_test_stream = () => {
	let storage: number[] = [];
	const list = new Stream_of_Sets<number>({
		are_equal: (n1, n2) => n1 === n2,
		attach(node) {
			storage.push(node);
			return true;
		},

		detach(node) {
			storage = storage.filter((f) => f !== node);
			return true;
		},
		iterate: () => storage[Symbol.iterator](),
	});
	return list;
};

// describe('reactive array properties', () => {
it("adding increases length", () => {
	const list = create_test_stream();
	expect(list.size).to.be.eq(0);

	list.add_and_replace_equal(1);
	expect(list.size).to.be.eq(1);
});

it("no duplicates", () => {
	const list = create_test_stream();
	expect(list.size).to.be.eq(0);
	list.add_and_replace_equal(1);
	list.add_and_replace_equal(1);
	expect(list.size).to.be.eq(1);
});

it("no duplicate trigger", () => {
	let counter = 0;
	let storage: number[] = [];
	const list = new Stream_of_Sets<number>({
		attach(node) {
			storage.push(node);
			return true;
		},

		detach(node) {
			storage = storage.filter((f) => f !== node);
			return true;
		},
		iterate: () => storage[Symbol.iterator](),
		on_add(...n) {
			counter = counter + n.length;
		},
	});
	expect(counter).to.be.eq(0);
	list.add_and_replace_equal(1);
	expect(counter).to.be.eq(1);
	list.add_and_replace_equal(1);
	expect(counter).to.be.eq(1);
});

it("removing", () => {
	const list = create_test_stream();
	expect(list.size).to.be.eq(0);
	list.add_and_replace_equal(1);
	list.remove_equal(1);
	expect(list.size).to.be.eq(0);
});

it("equality", () => {
	const list = create_test_stream();
	expect(list.are_equal(1, 1));
});

it("removing is revertible", () => {
	const list: Stream_of_Sets<number> = create_test_stream();
	expect(list.size).to.be.eq(0);
	list.add_and_replace_equal(1);
	expect(list.size).to.be.eq(1);
	list.save();
	list.remove_equal(1);
	expect(list.size).to.be.eq(0);
	list.reset();
	expect(list.size).to.be.eq(1);
});
// });
