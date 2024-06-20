/* eslint-disable @typescript-eslint/no-explicit-any */
// import type { Revertible } from '@wvhulle/reactive/revertible';
import type { Writable_Stream } from "@wvhulle/reactive";

import { HashMap, type Pair_Stream } from "../maps/hash_map.js";
import { Tensor } from "../maps/tensor.js";

/**
 * A class representing a graph data structure.
 * @template K - The type of the keys in the graph.
 * @template V - The type of the values in the graph.
 * @template Node - The type of the graph nodes.

 */
export class Graph<
	K,
	V,
	Node extends Pair_Stream<K, V> = Pair_Stream<K, V>,
> extends HashMap<K, V, Node> {
	readonly edges: Tensor<{ from: K; to: K }, number> = new Tensor<
		{ from: K; to: K },
		number
	>({
		name: `edges of a graph node`,
	});

	edge(from: K, to?: K) {
		if (to) {
			return this.edges.get_coordinate("from", from).get_coordinate("to", to);
		} else {
			return this.edges.get_coordinate("from", from);
		}
	}

	constructor({
		are_equal_keys,
		are_equal_values,

		attach,
		create_merged_value,

		detach,
		name,
		no_write,
		node_constructor,
		on_add,
		on_remove,

		sort_value_by,
	}: {
		are_equal_keys?: (k1: K, k2: K) => boolean;
		are_equal_values?: (k1: V, k2: V) => boolean;
		attach?: (node: Node) => boolean;
		create_merged_value?: (k: K, v1: V, v2: V) => V;
		detach?: (node: Node) => boolean;
		name?: string;
		no_write?: boolean;
		node_constructor?: new (key: K, v: V) => Node;
		on_add?: (v: Node) => boolean;
		on_remove?: (v: Node) => boolean;
		sort_value_by?: (value: V) => number;
	} = {}) {
		super({
			are_equal_keys,
			are_equal_values,

			attach_pair: attach,
			create_merged_value,

			detach_pair: detach,
			name,

			no_write,
			on_add,
			on_remove: (n) => {
				let is_removed = true;
				if (on_remove) {
					is_removed = on_remove(n);
				}
				// if (hasConstructor(s, Graph)) {
				// 	//[...n.distances].map((n) => n.value).includes();
				// 	// TODO check if graph is still connected.
				// }
				this.disconnect_nodes(n);
				return is_removed;
			},

			pair_constructor: node_constructor,

			sort_value_by,
		});
	}
	// override toString() {
	// 	const array = this.get()

	// 	if (array.length > 0) {
	// 		return (
	// 			`Graph of size ${array.length}:\n` +
	// 			depthFirstTraversal<undefined, string, Stream_of_Key_Values<K, V>>({
	// 				children: node => {
	// 					return this.edge(node.key)
	// 						.get()
	// 						.map(e => {
	// 							const to = this.getByKeys(e.key.to)[0]
	// 							return to
	// 						})
	// 						.filter(removeUndefined)
	// 						.map(node => ({
	// 							child: node,
	// 							dataGoingDown: undefined
	// 						}))
	// 				},
	// 				initialDataGoingDown: undefined,
	// 				mergeParentDataIntoChild: (current_string, children_string) =>
	// 					`[${current_string}] with child nodes:\n${children_string
	// 						.split('\n')
	// 						.map((l: string) => '  - ' + l)
	// 						.join('\n')}` + '\n',
	// 				mergeSiblings: (sibling1_string, sibling2_string) =>
	// 					`${sibling1_string}\n${sibling2_string}`,
	// 				nodeTransformer(node) {
	// 					return node.toString()
	// 				},
	// 				root: array[0]!
	// 			})
	// 		)
	// 	} else {
	// 		return 'Empty graph'
	// 	}
	// }
	number_of_edges_modified_after<W>(reactive: Writable_Stream<W>): number {
		return this.get().filter((n: Node) => this.edge(n.key).after<W>(reactive))
			.length;
	}

	connect_nodes_by_key(from_key: K, to_key: K, weight = 1): boolean {
		const from = this.get_or_throw_pair_by_key(from_key);
		const to = this.get_or_throw_pair_by_key(to_key);
		return this.connect_nodes(from, to, weight);
	}

	connect_nodes(from: Node, to: Node, weight = 1): boolean {
		// return from.linkTo(to, weight);
		const from_edges = this.edge(from.key);
		from_edges.assign({ to: to.key }, weight);
		const to_edges = this.edge(to.key);
		return to_edges.assign({ to: from.key }, weight);
	}

	disconnect_nodes(from: Node, to?: Node): number {
		const from_edges = this.edge(from.key);

		if (to) {
			const to_edges = this.edge(to.key);
			const ingoing_edges_removed = to_edges.remove_pairs_by_keys({
				to: from.key,
			});
			const outgoing_edges_removed = from_edges.remove_pairs_by_keys({
				to: to.key,
			});
			if (ingoing_edges_removed !== outgoing_edges_removed) {
				throw new Error(`Number of removed edges does not match.`);
			}
			return outgoing_edges_removed;
		} else {
			return [...from_edges]
				.map((edge): number => {
					// remove edge on neighbor
					const neighbor_in_current_graph = this.get_pairs_by_keys(
						edge.key.to,
					)[0] as Node | undefined;
					if (neighbor_in_current_graph) {
						return this.disconnect_nodes(from, neighbor_in_current_graph);
					} else {
						return 0;
					}
				})
				.reduce((acc: number, curr: number): number => acc + curr, 0);
		}
	}
}
