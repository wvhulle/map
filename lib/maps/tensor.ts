/* eslint-disable @typescript-eslint/no-explicit-any */
import { depthFirstTraversal, drop, keys } from "@wvhulle/object";

import { HashMap, type Pair_Stream } from "./hash_map.js";
import { RecursiveMap } from "./recursive_map.js";

export class Tensor<
	Key extends NonNullable<object>,
	Value,
	Container extends Pair_Stream<Key, Value> = Pair_Stream<Key, Value>,
> extends RecursiveMap<Key, Value, Container, never, never> {
	constructor({
		are_equal_keys,
		are_equal_values,
		create_merged_value,
		name,
		no_write,

		on_add,
		on_remove,
		pair_constructor,
		sort_value_by,
	}: {
		are_equal_keys?: (k1: Key, k2: Key) => boolean;

		are_equal_values?: (k1: Value, k2: Value) => boolean;

		create_merged_value?: (k: Key, v1: Value, v2: Value) => Value;
		name?: string;
		no_write?: boolean;

		on_add?: (v: Container) => boolean;
		on_remove?: (v: Container) => boolean;
		pair_constructor?: new (k: Key, v: Value) => Container;

		sort_value_by?: (value: Value) => number;
	} = {}) {
		super({
			are_equal_keys,
			are_equal_values,
			attach_pair: (node: Container) => {
				this.recurse_projections({
					coordinate_in_largest_space: node.key,
					transform_pair<D extends keyof Key>(
						projection: RecursiveMap<Key, Value, any, any, D>,
						key: Omit<Key, D>,
					) {
						Tensor.create_projection_if_not_exists(projection, key);

						if (HashMap.add_hash(projection, node)) {
							projection.enumerate();
						}
					},
				});
				return false;
			},

			create_merged_value,
			detach_pair: (node: Container) => {
				this.recurse_projections({
					coordinate_in_largest_space: node.key,
					transform_pair<D extends keyof Key>(
						projection: RecursiveMap<Key, Value, any, any, D>,
					) {
						if (RecursiveMap.remove_hash(projection, node)) {
							projection.enumerate();
						}
					},
				});
				return false;
			},

			name,
			no_write,
			on_add,
			on_remove,
			pair_constructor,

			sort_value_by,
		});

		// if (container_constructor) {
		// 	this.pair_constructor = container_constructor
		// }
	}

	static create_projection_if_not_exists<
		Key extends NonNullable<object>,
		D extends keyof Key,
	>(projection: RecursiveMap<Key, any, any, any, D>, key: Omit<Key, D>) {
		if (typeof key === "object" && keys(key as object).length > 1) {
			if (typeof key !== "object") {
				throw new Error(`Key type should be a non-null object.`);
			}

			if (
				!projection.projections ||
				keys(projection.projections).length === 0
			) {
				projection.projections = Object.fromEntries(
					keys(key).map((dimension) => [dimension, new Map()]),
				) as {
					[DD in Exclude<keyof Key, D>]: Map<
						string,
						RecursiveMap<Key, any, any, D | DD, DD>
					>;
				};
			}
		}
	}
	//nested: NestedHashMap<K, V, N, SS, never>;
	group_pairs_by_coordinate_in_dimension<D extends keyof Key>(
		d: D,
	): { key: Key[D]; nodes: Container[] }[] {
		if (this.projections) {
			if (d in this.projections) {
				return [...this.projections[d].values()].map((space) => ({
					key: space.fixed_coordinate,
					nodes: [...space],
				})) as {
					key: Key[D];
					nodes: Container[];
				}[];
			} else {
				throw new Error(
					`The dimension ${d.toString()} does not exist in ${this}`,
				);
			}
		} else {
			return [];
		}
	}

	remove_pairs_by_coordinates<D extends keyof Key, C extends Key[D]>(
		dimension: D,
		...coordinates: C[]
	): boolean[] {
		const p = this.projections;
		if (!p || !(dimension in p)) {
			throw new Error(
				`D ${dimension.toString()} is not declared to be indexed in constructor of map ${this.toString()}.`,
			);
		}

		return coordinates.flatMap((coordinate) => {
			const subspace = p[dimension].get(this.hash(coordinate));
			if (subspace) {
				for (const n of subspace) {
					this.remove_equivalent_containers(n);
				}
			}
			return p[dimension].delete(this.hash(coordinate));
		});
	}

	has_pairs_in_dimension_at_coordinate<D extends keyof Key, C extends Key[D]>(
		dimension: D,
		coordinate: C,
	): boolean {
		return this.get_coordinate(dimension, coordinate).size > 0;
	}

	recurse_projections<Data>({
		coordinate_in_largest_space,
		merge_results,
		transform_pair,
	}: {
		coordinate_in_largest_space: Key;
		merge_results?: (d1: Data, d2: Data) => Data;
		transform_pair: <D extends keyof Key>(
			projection: RecursiveMap<Key, Value, any, any, D>,
			subKey: Omit<Key, D>,
		) => Data;
	}): Data {
		if ((coordinate_in_largest_space as unknown) === null) {
			throw new Error(
				`Cannot recurse projections of ${this} if initial key is null.`,
			);
		}

		return depthFirstTraversal<
			Omit<Key, any>,
			Data,
			RecursiveMap<Key, Value, Container, any, any>
		>({
			children<D extends keyof Key>(
				space: RecursiveMap<Key, Value, Container, D, any>,
				key: Omit<Key, D>,
			) {
				if (typeof key !== "object") {
					throw new Error(`Key must be an object.`);
				}

				const children: {
					child: RecursiveMap<Key, Value, Container, any, any>;
					dataGoingDown: Omit<Key, D>;
				}[] = [];
				if (keys(key as object).length > 1) {
					keys(key).forEach(
						<DD extends Exclude<keyof Key, D>>(dimension: DD) => {
							const sub_key = drop(key, dimension) as Omit<Key, D | DD>;
							if ((sub_key as unknown) === null) {
								throw new Error(
									`Expected sub key of ${JSON.stringify(
										key,
									)} without ${dimension.toString()} not to be null.`,
								);
							}
							const coordinate = key[dimension] as Key[DD];

							const projection = space.get_coordinate<DD>(
								dimension,
								coordinate,
							);

							children.push({
								child: projection as RecursiveMap<
									Key,
									Value,
									Container,
									any,
									any
								>,
								dataGoingDown: sub_key as Omit<Key, D>,
							});
						},
					);
					return children;
				} else {
					return [];
				}
			},
			initialDataGoingDown: coordinate_in_largest_space as Omit<Key, never>,
			mergeSiblings: merge_results,
			nodeTransformer<D extends keyof Key>(
				space: RecursiveMap<Key, Value, Container, any, D>,
				sub_key?: Omit<Key, D>,
			) {
				if (!sub_key) {
					throw new Error(`Need key from the parent of ${space}.`);
				}
				return transform_pair(space, sub_key);
			},
			root: this as unknown as RecursiveMap<Key, Value, Container, any, any>,
		});
	}
}
