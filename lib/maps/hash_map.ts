import type { JavaScriptPrimitive } from "@wvhulle/object";
/* eslint-disable @typescript-eslint/no-explicit-any */
// import { map } from '@data/map';
import { Deep_Filter, Revertible_Bind } from "@wvhulle/reactive";
// import {  } from '@wvhulle/reactive'
import type { Readable_Stream } from "@wvhulle/reactive";
import { type Serializable, toJSON } from "@wvhulle/serializable";
import { sort } from "@wvhulle/serializable";

import {
	Spread_Stream,
	Stream_of_Sets_of_Streams,
} from "$lib/set/stream_of_sets_of_streams.js";

/**
 * A data structure to keep track of data that has a vector-like structure.
 * The data has to be indexed and have a value that changes over time.
 * The index can be any object.
 *
 * @template K The key to index the map.
 * @template V The value of the map.
 * @template Pair The data type of the key-value pair.
 */
export class HashMap<
	K,
	V,
	Pair extends Pair_Stream<K, V> = Pair_Stream<K, V>,
> extends Stream_of_Sets_of_Streams<[K, V], Pair> {
	override pair_constructor: new (
		k: K,
		v: V,
		equality?: (a: V, b: V) => boolean,
	) => Pair = Pair_Stream as new (
		k: K,
		v: V,
		equality?: (a: V, b: V) => boolean,
	) => Pair;
	constructor({
		are_equal_keys,
		are_equal_values,

		attach_pair,
		create_merged_value,

		detach_pair,
		get_by_key,
		hash,
		iterate,
		key_value_to_string,
		name,
		no_remove,
		no_write,
		on_add,

		on_remove,
		pair_constructor,
		sort_key_by,
		sort_value_by,
	}: {
		are_equal_keys?: (k1: K, k2: K) => boolean;
		are_equal_values?: (v1: V, v2: V) => boolean;
		attach_pair?: (node: Pair) => boolean;

		create_merged_value?: (k: K, v1: V, v2: V) => V;
		detach_pair?: (node: Pair) => boolean;
		get_by_key?: (key: K) => Pair | undefined;
		hash?: (k: K) => JavaScriptPrimitive;
		iterate?: () => Iterator<Pair, void, void>;
		key_value_to_string?: (k: K, v: V) => string;
		name?: string;
		no_remove?: boolean;
		no_write?: boolean;
		on_add?: (v: Pair) => void;
		on_remove?: (v: Pair) => void;
		pair_constructor?: new (
			key: K,
			value: V,
			are_equal?: (a: V, b: V) => boolean,
		) => Pair;
		sort_key_by?: (k: K) => number;
		sort_value_by?: (value: V) => number;
	} = {}) {
		super({
			are_equal_content: (n1, n2) =>
				this.are_equal_keys(n1[0], n2[0]) &&
				this.are_equal_values(n1[1], n2[1]),
			are_equivalent_content: ([k1, _v1]: [K, V], [k2, _v2]: [K, V]) => {
				return this.are_equal_keys(k1, k2);
			},
			attach_container: attach_pair
				? attach_pair
				: (node: Pair) => {
						if (sort_value_by) {
							node.value.subscribe(() => this.enumerate());
						}

						return HashMap.add_hash<K, Pair>(this, node);
					},
			container_constructor: pair_constructor
				? pair_constructor
				: (Pair_Stream as new (
						key: K,
						value: V,
						are_equal?: (a: V, b: V) => boolean,
					) => Pair),
			content_to_string: key_value_to_string,

			detach_container: detach_pair
				? detach_pair
				: (node) => {
						return HashMap.remove_hash<K, Pair>(this, node);
					},

			get_equivalent_by_content: ([k, _v]) => {
				return this.get_pair_by_key(k);
			},
			iterate: iterate
				? iterate
				: () => {
						return this.map.values();
					},

			merge_content_into: create_merged_value
				? ([k1, v1], [k2, v2]) => {
						if (!this.are_equal_keys(k1, k2)) {
							throw new Error(
								`When merging two key-value pairs in a hashmap, the keys have to be the same. Received the keys ${JSON.stringify(
									toJSON(k1 as Serializable),
								)} and ${JSON.stringify(
									toJSON(k2 as Serializable),
								)}. The current hashmap is ${this}.`,
							);
						}
						return [k1, create_merged_value(k1, v1, v2)];
					}
				: undefined,
			name,

			no_remove,
			no_write,
			on_add,
			on_remove,
			sort_content_by: (k, v) =>
				(sort_key_by?.(k) ?? 0) * 1000 + (sort_value_by?.(v) ?? 0),
		});

		if (are_equal_keys) {
			this.are_equal_keys = (k1, k2) => are_equal_keys(k1, k2);
		}
		if (are_equal_values) {
			this.are_equal_values = (v1, v2) => are_equal_values(v1, v2);
		}

		if (hash) {
			this.hash = (s: K) => hash(s);
		} else {
			this.hash = (k) => HashMap.stringify_serializable(k);
		}

		if (get_by_key) {
			this.get_pair_by_key = (k: K) => {
				const node = get_by_key(k);

				return node;
			};
		} else {
			this.get_pair_by_key = (k: K) => {
				const node = this.map.get(this.hash(k));

				return node;
			};
		}
	}

	are_equal_keys: (k1: K, k2: K) => boolean = (k1, k2) =>
		this.hash(k1) === this.hash(k2);
	are_equal_values: (v1: V, v2: V) => boolean = (v1, v2) => v1 === v2;
	// areEquivalentValues?: (v1: V, v2: V) => boolean;
	get_pair_by_key: (k: K) => Pair | undefined;
	hash: (k: any) => JavaScriptPrimitive;
	map = new Map<JavaScriptPrimitive, Pair>();
	// mergeValues: (k: K, v1: V, v2: V) => V = (_k, _v1, v2) => v2;

	static stringify_serializable(k: any) {
		// if (!isSerializable(k)) {
		// 	throw new Error(`${JSON.stringify(k)} is not serializable`);
		// }
		// removed encode for performance
		return JSON.stringify(sort(toJSON(k)));
	}

	has_key(k: K): boolean {
		return this.get_pair_by_key(k) !== undefined;
	}

	has_pair(p: Pair): boolean {
		return this.has_key(p.key);
	}

	assign(k: K, v: V) {
		const node: Pair = new this.pair_constructor(k, v, this.are_equal_values);

		return this.add_and_merge_equivalent_containers(node) > 0;
	}

	add_pairs(...pairs: Pair[]) {
		return this.add_and_merge_equivalent_containers(...pairs);
	}

	remove_pairs(...pairs: Pair[]) {
		return this.remove_equivalent_containers(...pairs);
	}

	remove_pairs_by_keys(...keys: K[]): number {
		const nodes = this.get_pairs_by_keys(...keys);
		return this.remove_equivalent_containers(...nodes);
	}

	get_pairs_by_keys(...keys: K[]): Pair[] {
		// const start = performance.now();
		const objects: Pair[] = [];

		for (const key of keys) {
			const object = this.get_pair_by_key(key);
			if (object) {
				objects.push(object);
			}
		}

		return objects;
	}
	get_or_throw_pair_by_key<Refined extends Pair>(key: K): Pair {
		const pair = this.get_pair_by_key(key);
		if (pair === undefined) {
			const e = `Node with key ${JSON.stringify(
				toJSON(key as Serializable),
			)} does not exist in ${this.toString()}. ${
				this.size > 0
					? `The existing elements are (at most 5 shown): \n${this.preview()}`
					: "The space is empty."
			}`;

			throw new Error(e);
		} else {
			return pair as Refined;
		}
	}
	get_or_throw_value_stream_by_key(key: K) {
		return this.get_or_throw_pair_by_key(key).value;
	}
	static add_hash<K, N extends Pair_Stream<K, any>>(
		hash_map: HashMap<K, any, N>,
		pair: N,
	) {
		const hash = hash_map.hash(pair.key);
		const predecessor: N | undefined = hash_map.map.get(hash);

		if (
			hash_map.no_write &&
			predecessor !== undefined &&
			!hash_map.are_equal_values(predecessor.value.get(), pair.value.get())
		) {
			throw new Error("Cannot modify values.");
		}

		hash_map.map.set(hash, pair);
		if (predecessor === undefined || !hash_map.are_equal(predecessor, pair)) {
			return true;
		} else {
			return false;
		}
	}
	static remove_hash<K, N extends Pair_Stream<K, any>>(
		hash_map: HashMap<K, any, N>,
		pair: N,
	) {
		const h = hash_map.hash(pair.key);
		return hash_map.map.delete(h);
	}

	find_key_for_value(condition: (v: V) => boolean): K | undefined {
		return this.get().find((n) => condition(n.value.get()))?.key;
	}

	*values(): IterableIterator<V> {
		for (const n of this) {
			yield n.value.get();
		}
	}

	filtered_stream(fn: (v: V) => boolean): Readable_Stream<Pair[]> {
		return new Deep_Filter(this, (c) => c.value, fn, true);
	}

	readonly modified_nodes: Readable_Stream<Pair[]> = new Deep_Filter(
		this,
		(n) => n.value.modified,
		undefined,
	);
}

export class Pair_Stream<K, V> extends Spread_Stream<[K, V]> {
	readonly value: Revertible_Bind<[K, V], V>;

	constructor(k: K, v: V, eq?: (a: V, b: V) => boolean) {
		super(k, v);
		this.value = new Revertible_Bind(
			this,
			([_, value]) => value,
			(new_value, [key, _]): [K, V] => [key, new_value],
			eq,
		);
	}

	get key(): K {
		return this.get()[0];
	}

	set key(new_key: K) {
		this.set([new_key, this.get()[1]]);
	}

	override toString(): string {
		return JSON.stringify(this.key);
	}
}
