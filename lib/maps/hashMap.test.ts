import { HashMap } from "./hash_map.js";

import { assert, expect, it } from "vitest";

class DummyClass {
	key: number;
	value: number;
	constructor(key: number, value: number) {
		this.key = key;
		this.value = value;
	}

	toJSON() {
		return this.key;
	}
}

it("overwriting a node", () => {
	const hash_map = new HashMap<number, number>();
	hash_map.assign(1, 1);

	hash_map.assign(1, 2);
	expect(hash_map.size).to.be.eq(1);

	expect(hash_map.get_or_throw_value_stream_by_key(1).get()).to.be.eq(2);
});

it("merging a node", () => {
	const hash_map = new HashMap<number, number>({
		create_merged_value: (v1, v2) => v1 + v2,
	});
	hash_map.assign(1, 1);
	hash_map.assign(1, 2);
	// expect(hash_map.size).to.be.eq(1);

	expect(hash_map.get_or_throw_value_stream_by_key(1).get()).to.be.eq(3);
});

it("soft-delete", () => {
	const hash_map = new HashMap<number, number>();
	hash_map.assign(1, 1);
	hash_map.save();
	hash_map.remove_pairs_by_keys(1);
	expect(hash_map.size).to.be.eq(0);
	hash_map.reset();
	expect(hash_map.size).to.be.eq(1);
});

it("adding one node brings the size to 1", () => {
	const hash_map = new HashMap<number, DummyClass>();
	const a = new DummyClass(1, 2);

	hash_map.assign(1, a);
	expect(hash_map.size === 1);
});

it("adding one node and removing it brings the size to 0", () => {
	const hash_map = new HashMap<number, DummyClass>();
	const a = new DummyClass(1, 2);

	hash_map.assign(1, a);

	expect(hash_map.size === 1);
	expect(hash_map.map.size).to.be.eq(1);
	hash_map.remove_pairs_by_keys(1);
	expect(hash_map.size === 0);
	expect(hash_map.map.size === 0);
});

it("adding one node to a map of size 2 and removing it, brings the size back to 2", () => {
	const hash_map = new HashMap<number, number>();

	hash_map.assign(1, 1);
	hash_map.assign(2, 2);
	hash_map.assign(3, 3);
	expect(hash_map.size === 3);
	expect(hash_map.map.size === 3);
	hash_map.remove_pairs_by_keys(2);
	expect(hash_map.size === 2);
	expect(hash_map.map.size === 2);
});

it("sort", () => {
	const list = new HashMap<string, { position: number }>({
		sort_value_by: ({ position: n }) => n,
	});

	list.assign("A", { position: 0 });
	list.assign("B", { position: 1 });

	const filter = list.filtered_stream(({ position: n }) => n > 0);
	expect(filter.get().length).toBe(1);

	list.assign("C", { position: 2 });
	expect(filter.get().length).toBe(2);

	const node = list.get_pair_by_key("C");

	assert(node !== undefined);

	node.value.set({ position: 0 });
	expect(filter.get().length).toBe(0);
});

it("modified nodes", () => {
	const hash_map = new HashMap<string, number>();
	hash_map.assign("A", 1);
	hash_map.assign("B", 2);
	hash_map.assign("C", 3);
	expect(hash_map.modified_nodes.get().length).toBe(0);
	const node = hash_map.get_pair_by_key("C");
	assert(node !== undefined);
	node.value.set(4);
	expect(hash_map.modified_nodes.get().length).toBe(1);
});

it("reorder", () => {
	const hash_map = new HashMap<string, number>({ sort_value_by: (v) => v });
	hash_map.assign("A", 1);
	hash_map.assign("B", 2);
	hash_map.assign("C", 3);
	// expect(hash_map.modified_nodes.get().length).toBe(0);
	const A = hash_map.get_pair_by_key("A");
	assert(A);
	const B = hash_map.get_pair_by_key("B");
	assert(B);
	B.value.set(1);
	A.value.set(2);
	// hash_map.enumerate();
	expect(hash_map.get().map((n) => n.key)).to.toStrictEqual(["B", "A", "C"]);
});
