/* eslint-disable @typescript-eslint/no-explicit-any */
import { Revertible } from "@wvhulle/reactive";
import { isSerializable, toJSON } from "@wvhulle/serializable";

export class Stream_of_Sets<Item> extends Revertible<Item[]> {
	name?: string;
	private fallback?: Set<Item>;

	on_add?: (...items: Item[]) => void;
	on_remove?: (...items: Item[]) => void;

	private to_string: (item: Item) => string = (item: Item) => {
		if (isSerializable(item)) {
			return JSON.stringify(toJSON(item));
		} else {
			return `Element of stream of sets`;
		}
	};
	private sort_items_by?: (item: Item) => number;

	no_remove?: boolean;

	constructor({
		are_equal,
		attach,
		detach,
		get_equal,
		iterate,
		name,
		no_remove,
		on_add,
		on_remove,
		sort_by,
		to_string,
	}: {
		are_equal?: (n1: Item, n2: Item) => boolean;
		attach?: (item: Item) => boolean;
		detach?: (item: Item) => boolean;
		get_equal?: (item: Item) => Item | undefined;
		iterate?: () => Iterator<Item, void, void>;
		name?: string;
		no_remove?: boolean;
		on_add?: (...v: Item[]) => void;
		on_remove?: (...v: Item[]) => void;
		sort_by?: (item: Item) => number;
		to_string?: (item: Item) => string;
	}) {
		super([]);
		this.sort_items_by = sort_by;

		if (are_equal) {
			this.are_equal = are_equal;
		}

		this.no_remove = no_remove;

		if (attach) {
			this.attach = attach;
		}

		if (detach) {
			this.detach = detach;
		}

		if (get_equal) {
			this.get_equal = get_equal;
		}
		if (iterate) {
			this[Symbol.iterator] = iterate;
		}

		this.name = name;

		this.on_add = on_add;

		this.on_remove = on_remove;

		if (to_string) {
			this.to_string = to_string;
		}
	}

	are_equal(n1: Item, n2: Item): boolean {
		return n1 === n2;
	}

	get_equal(item: Item): Item | undefined {
		return [...this].find((internal_node) =>
			this.are_equal(internal_node, item),
		);
	}

	attach(item: Item): boolean {
		if (!this.fallback) {
			this.fallback = new Set();
		}
		if (this.fallback.has(item)) {
			return false;
		} else {
			this.fallback.add(item);
			return true;
		}
	}

	detach(item: Item): boolean {
		if (!this.fallback) {
			this.fallback = new Set();
		}

		return this.fallback.delete(item);
	}
	override toString(): string {
		return this.name ?? this.constructor.name;
	}

	preview(): string {
		return (
			this.get()
				.slice(0, 20)
				.map((item, index) => {
					const string_representation = this.to_string(item);

					return `[${index}]. ` + string_representation;
				})
				.join("\n") + "..."
		);
	}

	add_and_replace_equal(...items: Item[]): number {
		const modified_items: Item[] = [];

		items.forEach((external_container) => {
			const internal_equal_container: Item | undefined =
				this.get_equal(external_container);
			if (internal_equal_container === undefined) {
				modified_items.push(external_container);
			} else {
				this.detach(internal_equal_container);
			}

			this.attach(external_container);
		});

		if (modified_items.length > 0) {
			this.enumerate();
			this.on_add?.(...modified_items);
		}

		return items.length;
	}

	has_equal(item: Item): boolean {
		const existing: Item | undefined = this.get_equal(item);

		return existing ? true : false;
	}

	remove_equal(...items: Item[]): number {
		// let removed = 0;
		const removed_items: Item[] = [];
		items.forEach((item) => {
			const existing: Item | undefined = this.get_equal(item);
			if (existing) {
				if (this.no_remove) {
					throw new Error(`Cannot remove from ${this}.`);
				}

				if (this.detach(existing)) {
					removed_items.push(existing);
				}
			}
		});
		if (removed_items.length > 0) {
			this.enumerate();
			this.on_remove?.(...removed_items);
		}

		return removed_items.length;
	}

	[Symbol.iterator](): Iterator<Item, void, void> {
		if (!this.fallback) {
			this.fallback = new Set();
		}
		return this.fallback[Symbol.iterator]();
	}

	enumerate() {
		this.set(this.toArray());
	}

	private toArray(): Item[] {
		const list = [...this];
		if (this.sort_items_by) {
			return list.sort((a, b) =>
				this.sort_items_by ? this.sort_items_by(a) - this.sort_items_by(b) : 0,
			);
		} else {
			return list;
		}
	}

	get size(): number {
		return this.get().length;
	}
	empty() {
		const removed = this.remove_equal(...this.get());
		if (removed > 0) {
			this.enumerate();
		}
		return removed;
	}
}
