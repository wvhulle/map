import { HashMap, type Pair_Stream } from "./hash_map.js";

export class Matrix<
	X,
	Y,
	V,
	N extends Pair_Stream<{ column: Y; row: X }, V> = Pair_Stream<
		{ column: Y; row: X },
		V
	>,
> extends HashMap<{ column: Y; row: X }, V, N> {
	private map_of_rows = new HashMap<X, HashMap<{ column: Y; row: X }, V, N>>();

	constructor({
		are_equal_values,
		element_constructor,
		name,
		on_add,
		on_remove,
	}: {
		are_equal_values?: (v1: V, v2: V) => boolean;
		element_constructor?: new (key: { column: Y; row: X }, value: V) => N;
		name?: string;
		on_add?: ((v: N) => boolean) | undefined;
		on_remove?: ((v: N) => boolean) | undefined;
	}) {
		super({
			are_equal_values,

			attach_pair: (node: N) => {
				const { row } = node.key;
				const row_space = this.map_of_rows.get_pair_by_key(row)?.value.get();
				if (row_space) {
					return row_space.add_and_merge_equivalent_containers(node) > 0;
				} else {
					const new_row = new HashMap<{ column: Y; row: X }, V, N>();
					new_row.add_and_merge_equivalent_containers(node);
					this.map_of_rows.assign(row, new_row);
					return true;
				}
			},
			detach_pair: (node: N) => {
				const { row } = node.key;
				const row_space = this.map_of_rows.get_pair_by_key(row)?.value.get();
				if (row_space) {
					return row_space.remove_equivalent_containers(node) > 0;
				} else {
					return false;
				}
			},
			get_by_key: (key) => {
				const { row } = key;
				const row_space = this.map_of_rows.get_pair_by_key(row)?.value.get();
				if (row_space) {
					return row_space.get_pair_by_key(key);
				} else {
					return undefined;
				}
			},
			iterate: () => this.iterate_rows(),
			name,
			on_add,
			on_remove,
			pair_constructor: element_constructor,
		});
	}

	private *iterate_rows() {
		const rows = this.map_of_rows;
		for (const row of rows) {
			for (const cell of row.value.get()) {
				yield cell;
			}
		}
	}

	get_row(x: X) {
		const row = this.map_of_rows.get_pair_by_key(x)?.value.get();
		if (row) {
			return row;
		} else {
			const map = new HashMap<{ column: Y; row: X }, V, N>();
			this.map_of_rows.assign(x, map);
			return map;
		}

		// return row.value.get();
	}

	remove_rows(...x: X[]) {
		return this.map_of_rows.remove_pairs_by_keys(...x);
	}
}
