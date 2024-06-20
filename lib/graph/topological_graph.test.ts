/* eslint-disable no-debugger */
import { HashMap } from "../maps/hash_map.js";
import { TopologicalGraph } from "./topological_graph.js";

import { assert, describe, expect, it } from "vitest";

describe("singleton graphs", () => {
	it("self-link one node graph gives one length path", () => {
		const graph = new TopologicalGraph<number, number>();
		graph.assign(1, 1);
		expect(graph.shortest_path_between_keys(1, 1)).to.have.length(1);
	});

	it("a graph is also a hashMap", () => {
		const graph = new TopologicalGraph<number, number>();
		graph.assign(1, 1);
		expect(graph).toBeInstanceOf(HashMap);
	});
});

it("removing", () => {
	const graph = new TopologicalGraph<string, number>();
	graph.assign("A", 1);
	expect(graph.size).to.be.eq(1);
	const node = graph.get_pair_by_key("A");
	assert(node);
	graph.remove_equivalent_containers(node);
	expect(graph.size).to.be.eq(0);
});

describe("add edges", () => {
	it("size updates correctly", () => {
		const graph = new TopologicalGraph<number, number>();
		graph.assign(1, 1);
		graph.assign(2, 2);
		expect(graph.size).to.be.equal(2);
	});

	it("edge gives connection", () => {
		const graph = new TopologicalGraph<number, number>();
		graph.assign(1, 1);
		graph.assign(2, 2);

		graph.connect_nodes_by_key(1, 2);
		expect(graph.are_connected_keys(1, 2)).to.be.equal(true);
	});

	it("two links make a three length path", () => {
		const graph = new TopologicalGraph<number, number>();
		graph.assign(1, 1);
		graph.assign(2, 2);
		graph.assign(3, 3);

		graph.connect_nodes_by_key(1, 2);
		graph.connect_nodes_by_key(2, 3);
		expect(graph.shortest_path_between_keys(1, 3)).to.have.length(3);
	});

	it("adding a node recalculates paths", () => {
		const graph = new TopologicalGraph<number, number>();
		graph.assign(1, 1);

		graph.assign(2, 2);
		graph.connect_nodes_by_key(1, 2);

		expect(graph.shortest_path_between_keys(1, 2)).to.have.length(2);
		graph.assign(3, 3);
		graph.connect_nodes_by_key(2, 3);

		expect(graph.shortest_path_between_keys(2, 3)).to.have.length(2);
	});
});

describe("removal of edges", () => {
	it("removing an edge also removes it from the other node", () => {
		const graph = new TopologicalGraph<number, number>();
		graph.assign(1, 1);
		graph.assign(2, 2);

		graph.connect_nodes_by_key(1, 2);
		graph.remove_pairs_by_keys(2);
		const n = graph.get_pair_by_key(1);
		assert(n);
		expect(graph.edge(n.key).size).toBe(0);
	});

	it("three length path becomes a zero length path after removal", () => {
		const graph = new TopologicalGraph<number, number>();
		graph.assign(1, 1);
		graph.assign(2, 2);
		graph.assign(3, 3);

		graph.connect_nodes_by_key(1, 2);
		graph.connect_nodes_by_key(2, 3);
		expect(graph.shortest_path_between_keys(1, 3)).toHaveLength(3);
		graph.remove_pairs_by_keys(2);

		expect(graph.shortest_path_between_keys(1, 3)).toHaveLength(0);
	});
});
