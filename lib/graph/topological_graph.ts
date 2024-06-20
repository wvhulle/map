/* eslint-disable @typescript-eslint/no-explicit-any */
// import type { Revertible } from '@wvhulle/reactive/revertible';
import { HashMap, type Pair_Stream } from "../maps/hash_map.js";
import { Tensor } from "../maps/tensor.js";
import { Queue } from "../set/queue.js";
import { Graph } from "./graph.js";

/**
 * A class representing a graph data structure.
 * @template K - The type of the keys in the graph.
 * @template V - The type of the values in the graph.
 * @template N - The type of the graph nodes.
 */
export class TopologicalGraph<
	K,
	V,
	N extends Pair_Stream<K, V> = Pair_Stream<K, V>,
> extends Graph<K, V, N> {
	readonly distances: Tensor<{ from: K; to: K }, number> = new Tensor<
		{ from: K; to: K },
		number
	>({
		name: `shortest distances from ${this}`,
	});

	readonly shortest_paths: Tensor<{ from: K; to: K }, K[]> = new Tensor<
		{ from: K; to: K },
		K[]
	>({
		name: `shortest paths from ${this}`,
	});

	shortest_paths_between(from: K, to?: K) {
		if (to) {
			return this.shortest_paths
				.get_coordinate("from", from)
				.get_coordinate("to", to);
		} else {
			return this.shortest_paths.get_coordinate("from", from);
		}
	}

	distance_between(from: K, to?: K) {
		if (to) {
			return this.distances
				.get_coordinate("from", from)
				.get_coordinate("to", to);
		} else {
			return this.distances.get_coordinate("from", from);
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
		attach?: (node: N) => boolean;
		create_merged_value?: (k: K, v1: V, v2: V) => V;
		detach?: (node: N) => boolean;
		equal?: (n1: N, n2: N) => boolean;
		equivalent?: (n1: N, n2: N) => boolean;
		name?: string;
		no_write?: boolean;
		node_constructor?: new (key: K, v: V) => N;
		on_add?: (v: N) => boolean;
		on_remove?: (v: N) => boolean;

		sort?: (value: V) => number;

		sort_value_by?: (value: V) => number;
	} = {}) {
		super({
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
		});
	}

	// eslint-disable-next-line complexity
	shortest_path_between_nodes(start: N, end: N): N[] {
		// Dijkstra's shortest path algorithm
		if (this.are_equal(start, end)) {
			return [start];
		}

		if (!this.has_pair(start)) {
			throw new Error(`Start node ${start} is not on the graph ${this}.`);
		}

		if (!this.has_pair(end)) {
			throw new Error(`End node ${end} is not on the graph ${this}.`);
		}

		// const reCalculated = false;
		const start_paths = this.shortest_paths_between(start.key);
		const start_distances = this.distance_between(start.key);
		if (
			this.number_of_edges_modified_after(start_paths) > 0 ||
			!start_paths.has_key({ to: end.key })
		) {
			start_paths.empty();
			start_distances.empty();
			const previous_nodes = new HashMap<{ next: K; target: K }, K | null>({
				name: `[previous nodes from ${JSON.stringify(start.key)}]`,
			});
			const visited = new HashMap<K, V>({
				name: `[visited nodes from ${JSON.stringify(start.key)}]`,
			});

			// Initialize all distances to Infinity and no previous nodes
			[...this].forEach((node: N) => {
				start_distances.assign({ to: node.key }, Number.POSITIVE_INFINITY);

				previous_nodes.assign(
					{
						next: node.key,
						target: end.key,
					},
					null,
				);
			});
			// Set distance of start node to 0
			start_distances.assign({ to: start.key }, 0);
			// Create a priority queue to store the nodes
			const unvisited_nodes = new Queue({
				sort: (a: K) =>
					start_distances.get_or_throw_value_stream_by_key({ to: a }).get(),
			});
			// Add start node to priority queue
			unvisited_nodes.add_and_replace_equal(start.key);
			while (!unvisited_nodes.isEmpty()) {
				// Get the node with minimum distance
				const next_unvisited = unvisited_nodes.dequeue();
				if (next_unvisited === undefined) {
					throw new Error(
						"The queue was non empty, so this should be non-null.",
					);
				}

				if (!this.has_key(next_unvisited)) {
					throw new Error(
						`An outgoing edge of the elements ${visited.preview()} in ${this} does not end in the same graph but ends in ${JSON.stringify(
							next_unvisited,
						)}. To calculate a route to it, it has to be made part of the graph.`,
					);
				}

				const current_node = this.get_or_throw_pair_by_key(next_unvisited);
				// If it is the end node, we are done
				const edges_of_current_node = this.edge(current_node.key);
				if (this.are_equal(current_node, end)) {
					break;
				}
				// Iterate through the edges
				[...edges_of_current_node].forEach((edge) => {
					// Get the node at the other end of the edge

					if (!this.has_key(edge.key.to)) {
						throw new Error(
							`An outgoing edge of ${current_node} in ${this} does not end in the same graph. To calculate a route to it, it has to be made part of the graph.`,
						);
					}

					const next = this.get_or_throw_pair_by_key(edge.key.to);
					// Calculate the distance from start node to start node

					if (!start_distances.has_key({ to: current_node.key })) {
						throw new Error(
							`There is no known shortest distance going from ${start} to ${current_node}.`,
						);
					}

					const distance =
						start_distances
							.get_or_throw_value_stream_by_key({ to: current_node.key })
							.get() + edge.value.get();
					// If start distance is less than the stored distance, update the stored distance
					const distance_to_next = start_distances
						.get_or_throw_value_stream_by_key({ to: next.key })
						.get();

					if (distance < distance_to_next) {
						start_distances.assign({ to: next.key }, distance);
						previous_nodes.assign(
							{
								next: next.key,
								target: end.key,
							},
							current_node.key,
						);
						unvisited_nodes.enqueue(next.key);
					}
				});
				// Mark the current node as visited
				visited.add_and_merge_equivalent_containers(current_node);
			}

			const reversed_path: N[] = [];
			let current_node: N | null = end;
			// Check if there exists a path

			const distance_to_end = start_distances
				.get_or_throw_value_stream_by_key({ to: current_node.key })
				.get();
			if (distance_to_end === Number.POSITIVE_INFINITY) {
				return [];
			}

			// Iterate through the previous nodes and add them to the path
			for (;;) {
				reversed_path.push(current_node);
				const previous: K | null = previous_nodes
					.get_or_throw_value_stream_by_key({
						next: current_node.key,
						target: end.key,
					})
					.get();

				if (!previous) {
					break;
				}
				current_node = this.get_or_throw_pair_by_key(previous);
			}
			const path = reversed_path.reverse().map((n) => n.key);
			for (let i = 0; i < path.length; i++) {
				start_paths.assign({ to: end.key }, path.slice(0, i + 1));
				// reCalculated = true;
			}
		}
		// console.log(`Recalculated paths`, reCalculated);
		const path = start_paths
			.get_or_throw_value_stream_by_key({ to: end.key })
			.get();
		return path.map((k) => this.get_or_throw_pair_by_key(k));
	}
	shortest_path_between_keys(from_key: K, to_key: K) {
		if (!this.has_key(from_key)) {
			throw new Error(
				`Start node ${JSON.stringify(from_key)} is not on the graph ${this}.`,
			);
		}

		if (!this.has_key(to_key)) {
			throw new Error(
				`End node ${JSON.stringify(to_key)} is not on the graph ${this}.`,
			);
		}
		const from = this.get_or_throw_pair_by_key(from_key);
		const to = this.get_or_throw_pair_by_key(to_key);
		return this.shortest_path_between_nodes(from, to);
	}

	closest_node_to_node(from: N, to?: N): N | undefined {
		if (to) {
			const path = this.shortest_path_between_nodes(from, to);

			if (path.length > 1) {
				return path[1];
			} else {
				return undefined;
			}
		} else {
			const others = this.distance_between(from.key);
			others.remove_pairs_by_keys({ to: from.key });
			const closest_distance = Math.max(
				...[...others].map((d) => d.value.get()),
			);
			const key: K | undefined = [...others].find(
				(d) => d.value.get() === closest_distance,
			)?.key.to;

			if (key) {
				return this.get_or_throw_pair_by_key(key);
			} else {
				return undefined;
			}
		}
	}

	closest_node_to_key(from_key: K, to_key: K): N | undefined {
		let from: N;

		try {
			from = this.get_or_throw_pair_by_key(from_key);
		} catch (e) {
			throw new Error(
				`Could not search for a route starting at ${JSON.stringify(
					from_key,
				)} since it is not included in the graph ${this}`,
			);
		}

		let to: N;
		try {
			to = this.get_or_throw_pair_by_key(to_key);
		} catch (e) {
			throw new Error(
				`Could not find a route from ${JSON.stringify(from_key)} to ${JSON.stringify(
					to_key,
				)} since the endpoint is not in ${this}`,
			);
		}

		const path = this.shortest_path_between_nodes(from, to);

		if (path.length > 1) {
			return path[1];
		} else {
			return undefined;
		}
	}

	are_connected_keys(from_key: K, to_key: K) {
		const from = this.get_or_throw_pair_by_key(from_key);
		const to = this.get_or_throw_pair_by_key(to_key);
		return this.shortest_path_between_nodes(from, to).length > 0;
	}

	are_connected_nodes(from: N, to: N): boolean {
		return (
			this.shortest_path_between_nodes(
				from as this extends N ? this : never,
				to,
			).length > 0
		);
	}
}
