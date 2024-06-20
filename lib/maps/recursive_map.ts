import { drop, keys } from "@wvhulle/object";
import type { JavaScriptPrimitive } from "@wvhulle/object";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Serializable, toJSON } from "@wvhulle/serializable";

import { HashMap, type Pair_Stream } from "./hash_map.js";

/**
 * Nested hash map
 * @template K Key that is an object, so recursive hash maps can be made. The indexes of the recursive hashmaps are computed by first dropping keys of the key object and computing the hash.
 * @template V
 * @template N
 * @template S
 * @template DroppedInSuperSpace The DroppedInSuperSpace dimensions.
 * @template LastDroppedInSuperSpace The last DroppedInSuperSpace dimension. Used in methods internal to this class.
 */
export class RecursiveMap<
	K extends NonNullable<object>,
	V,
	N extends Pair_Stream<any, V> = Pair_Stream<K, V>,
	DroppedInSuperSpace extends keyof K = never,
	LastDroppedInSuperSpace extends DroppedInSuperSpace = DroppedInSuperSpace,
> extends HashMap<Omit<K, DroppedInSuperSpace>, V, N> {
	constructor({
		are_equal_keys,
		are_equal_values,
		attach_pair,

		create_merged_value,
		detach_pair,
		fixed_coordinate,
		fixed_dimension,
		name,
		no_write,

		on_add,
		on_remove,
		pair_constructor,
		parent_hash_map,
		sort_value_by,
	}: {
		are_equal_keys?: (
			k1: Omit<K, DroppedInSuperSpace>,
			k2: Omit<K, DroppedInSuperSpace>,
		) => boolean;
		are_equal_values?: (k1: V, v2: V) => boolean;
		attach_pair?: (node: N, oldNode?: N) => boolean;
		create_merged_value?: (k: Omit<K, DroppedInSuperSpace>, v1: V, v2: V) => V;
		detach_pair?: (node: N) => boolean;
		fixed_coordinate?: K[LastDroppedInSuperSpace];
		fixed_dimension?: LastDroppedInSuperSpace;
		name?: string;
		no_write?: boolean;

		on_add?: (node: N) => boolean;
		on_remove?: (node: N) => boolean;
		pair_constructor?: new (k: Omit<K, DroppedInSuperSpace>, v: V) => N;
		parent_hash_map?: RecursiveMap<
			K,
			V,
			N,
			Exclude<DroppedInSuperSpace, LastDroppedInSuperSpace>
		>;
		sort_value_by?: (value: V) => number;
	} = {}) {
		super({
			are_equal_keys,
			are_equal_values,
			attach_pair: attach_pair
				? attach_pair
				: (node) => RecursiveMap.add_hash(this, node),
			create_merged_value,
			detach_pair: detach_pair
				? detach_pair
				: (node) => {
						this.remove_in_parent(node);
						return RecursiveMap.remove_hash(this, node);
					},
			hash: (key) => {
				if ((key as unknown) === null) {
					throw new Error(
						`Expected a non-empty key to hash but received null in ${this.toString()}`,
					);
				}

				const fixed_dimensions: DroppedInSuperSpace[] = [];

				// eslint-disable-next-line @typescript-eslint/no-this-alias
				let parent = this as RecursiveMap<K, V, N, any, any> | undefined;

				while (parent?.fixed_dimension !== undefined) {
					fixed_dimensions.push(parent.fixed_dimension as DroppedInSuperSpace);
					parent = parent.parent_space as
						| RecursiveMap<K, V, N, any, any>
						| undefined;
				}

				if (fixed_dimensions.length > 0) {
					key = drop<K, DroppedInSuperSpace>(key as K, ...fixed_dimensions);
				}
				return HashMap.stringify_serializable(key);
			},

			name,
			no_write,
			on_add,
			on_remove,
			pair_constructor,

			sort_value_by,
		});
		this.parent_space = parent_hash_map;
		this.fixed_dimension = fixed_dimension;
		this.fixed_coordinate = fixed_coordinate;
	}

	remove_in_parent(node: N) {
		let parent = this.parent_space;
		while (parent !== undefined) {
			if (RecursiveMap.remove_hash(parent, node)) {
				parent.enumerate();
			}

			parent = parent.parent_space as
				| RecursiveMap<K, V, N, any, any>
				| undefined;
		}

		// return deleted;
	}

	parent_space?: RecursiveMap<
		K,
		V,
		N,
		Exclude<DroppedInSuperSpace, LastDroppedInSuperSpace>
	>;

	projections?: {
		[DroppedInCurrentSpace in keyof Omit<K, DroppedInSuperSpace>]: Map<
			JavaScriptPrimitive,
			RecursiveMap<
				K,
				V,
				N,
				DroppedInSuperSpace | DroppedInCurrentSpace,
				DroppedInCurrentSpace
			>
		>;
	};

	fixed_dimension?: LastDroppedInSuperSpace;
	fixed_coordinate?: K[LastDroppedInSuperSpace];
	override toString(): string {
		if (this.parent_space) {
			return `Projection on coordinate ${this.fixed_dimension?.toString()} = ${JSON.stringify(
				toJSON(this.fixed_coordinate as Serializable),
			)}`;
		} else {
			return `${super.toString()}\n ${
				this.projections && keys(this.projections).length > 0
					? `with subspaces: \n${this.previewDimensions()}`
					: ""
			}`;
		}
	}
	previewDimensions() {
		return keys(this.projections ?? {})
			.map(
				(fixed_dimension: Exclude<keyof K, DroppedInSuperSpace>) =>
					`- ${fixed_dimension.toString()} (rows: ${
						this.projections?.[fixed_dimension].size
					})`,
			)
			.join(",\n");
	}

	get_coordinate<
		ToDropInCurrentSpace extends Exclude<keyof K, DroppedInSuperSpace>,
	>(
		dimension: ToDropInCurrentSpace,
		coordinate: K[ToDropInCurrentSpace],
	): RecursiveMap<
		K,
		V,
		N,
		DroppedInSuperSpace | ToDropInCurrentSpace,
		ToDropInCurrentSpace
	> {
		const h = HashMap.stringify_serializable(coordinate);
		if (!this.projections) {
			this.projections = {} as {
				[DD in keyof Omit<K, DroppedInSuperSpace>]: Map<
					string,
					RecursiveMap<K, V, N, DroppedInSuperSpace | DD, DD>
				>;
			};
		}

		if (!this.projections[dimension] as unknown) {
			this.projections[dimension] = new Map();
		}

		let projection = this.projections[dimension].get(h);
		if (!projection) {
			projection = new RecursiveMap<
				K,
				V,
				N,
				DroppedInSuperSpace | ToDropInCurrentSpace,
				ToDropInCurrentSpace
			>({
				fixed_coordinate: coordinate,
				fixed_dimension: dimension,
				name: `${dimension.toString()}`,
				parent_hash_map: this as RecursiveMap<K, V, N, any>,
			});
		}

		this.projections[dimension].set(h, projection);
		return projection;
	}
}
