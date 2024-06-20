import { Stream_of_Sets } from "./stream_of_sets.js";

export class Stream_of_Sets_with_Equivalence<
	Container,
> extends Stream_of_Sets<Container> {
	no_write = false;

	private merge_into_container: (
		inserted: Container,
		replaced: Container,
	) => void;

	constructor({
		are_equal_containers,
		are_equivalent_containers,
		attach_container,
		container_to_string,
		detach_container,
		get_equal_container,
		get_equivalent_container,
		iterate_container,
		merge_into_container,
		name,
		no_remove,
		no_write,
		on_add_container,
		on_remove_container,
		sort_container_by,
	}: {
		are_equal_containers?: (c1: Container, c2: Container) => boolean;
		are_equivalent_containers: (c1: Container, c2: Container) => boolean;
		attach_container: (container: Container) => boolean;
		container_to_string?: (container: Container) => string;
		detach_container: (container: Container) => boolean;
		get_equal_container?: (container: Container) => Container | undefined;
		get_equivalent_container?: (container: Container) => Container | undefined;
		iterate_container: () => Iterator<Container, void, void>;
		merge_into_container?: (
			inserted: Container,
			replaced: Container,
		) => Container;
		name?: string;
		no_remove?: boolean;
		no_write?: boolean;
		on_add_container?: (...v: Container[]) => void;
		on_remove_container?: (...v: Container[]) => void;
		sort_container_by?: (container: Container) => number;
	}) {
		super({
			are_equal: are_equal_containers,
			attach: attach_container,
			detach: detach_container,
			get_equal: get_equal_container,
			iterate: iterate_container,
			name,
			no_remove,
			on_add: on_add_container,
			on_remove: on_remove_container,
			sort_by: sort_container_by,
			to_string: container_to_string,
		});

		this.no_write = no_write ?? false;

		this.merge_into_container = (inserted_container, replaced_container) => {
			if (this.no_write) {
				throw new Error(`Cannot modify containers of ${this}.`);
			}

			const merged =
				merge_into_container?.(inserted_container, replaced_container) ??
				inserted_container;

			if (
				typeof inserted_container === "object" &&
				inserted_container &&
				typeof replaced_container === "object" &&
				replaced_container
			) {
				Object.assign(inserted_container, merged);
				Object.assign(replaced_container, merged);
			}
		};

		this.are_equivalent_containers = are_equivalent_containers;

		if (get_equivalent_container) {
			this.get_equivalent_containers = get_equivalent_container;
		} else {
			this.get_equivalent_containers = (container) => this.get_equal(container);
		}
	}

	has_equivalent_container(item: Container): boolean {
		const existing: Container | undefined =
			this.get_equivalent_containers(item);

		return existing ? true : false;
	}

	are_equivalent_containers: (c1: Container, c2: Container) => boolean;

	get_equivalent_containers: (container: Container) => Container | undefined;

	add_and_merge_equivalent_containers(...containers: Container[]): number {
		const modified_nodes: Container[] = [];
		containers.forEach((inserted_container) => {
			const equivalent_container: Container | undefined =
				this.get_equivalent_containers(inserted_container);

			if (equivalent_container !== undefined) {
				if (this.are_equal(equivalent_container, inserted_container)) {
					this.detach(equivalent_container);
				} else {
					this.merge_into_container(inserted_container, equivalent_container);
				}
			}
			modified_nodes.push(inserted_container);
			this.attach(inserted_container);
		});

		if (modified_nodes.length > 0) {
			this.enumerate();
			this.on_add?.(...modified_nodes);
		}

		return modified_nodes.length;
	}

	remove_equivalent_containers(...items: Container[]): number {
		// let removed = 0;
		const removed_items: Container[] = [];
		items.forEach((item) => {
			const existing: Container | undefined =
				this.get_equivalent_containers(item);
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
}
