import { HashMap, type Pair_Stream } from "./hash_map.js";

export class Hash_Priority_Queue<K, V> extends HashMap<
	K,
	V,
	Pair_Stream<K, V>
> {
	private priority = new Map<V, number>();
	key: (v: V) => K;
	// private readonly comparator?: (a: V, b: V) => number;
	constructor({
		key,
		// comparator,
		on_add,
		on_remove,
	}: {
		// comparator?: (a: V, b: V) => number;
		key: (v: V) => K;
		on_add?: (...t: V[]) => void;
		on_remove?: (...t: V[]) => void;
	}) {
		super({
			on_add: on_add ? (v) => on_add(v.value.get()) : undefined,
			on_remove: on_remove ? (v) => on_remove(v.value.get()) : undefined,
			sort_value_by: (v) => this.priority.get(v) ?? 0,
		});
		this.key = key;
		// this.comparator = comparator;
	}

	enqueue(item: V, priority?: number): void {
		this.assign(this.key(item), item);

		this.priority.set(
			item,
			priority ?? Math.max(...[...this.priority.values()]) + 1,
		);
	}

	dequeue(): V | undefined {
		const array = this.get();
		if (array.length > 0) {
			const item = array[0]!;
			this.priority.delete(item.value.get());

			this.remove_equivalent_containers(item);
			return item.value.get();
		} else {
			return undefined;
		}
	}

	peek(): V | undefined {
		const current = this.get();
		if (current.length > 0) {
			return current[0]!.value.get();
		} else {
			return undefined;
		}
	}

	isEmpty(): boolean {
		return this.get().length === 0;
	}
}
