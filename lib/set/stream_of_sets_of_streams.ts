/* eslint-disable @typescript-eslint/no-explicit-any */
import { Writable_Stream } from "@wvhulle/reactive";

import { Stream_of_Sets_with_Equivalence } from "./stream_of_sets_with_equivalence.js";

export class Stream_of_Sets_of_Streams<
	Content extends any[],
	Container extends Spread_Stream<Content> = Spread_Stream<Content>,
> extends Stream_of_Sets_with_Equivalence<Container> {
	pair_constructor: new (...data: Content) => Container = Spread_Stream as new (
		...data: Content
	) => Container;

	// eslint-disable-next-line complexity
	constructor({
		are_equal_content,
		are_equivalent_content,
		attach_container: attach,
		container_constructor,
		content_to_string,
		detach_container: detach,
		get_equal_by_content,
		get_equivalent_by_content,
		iterate,
		merge_container,
		merge_content_into,
		name,
		no_remove,
		no_write,
		on_add,
		on_remove,
		sort_content_by,
	}: {
		are_equal_content?: (d1: Content, d2: Content) => boolean;
		are_equivalent_content: (d1: Content, d2: Content) => boolean;
		attach_container: (inserted: Container, replaced?: Container) => boolean;
		container_constructor?: new (...data: Content) => Container;
		content_to_string?: (...n: Content) => string;
		detach_container: (node: Container) => boolean;
		get_equal_by_content?: (data: Content) => Container | undefined;
		get_equivalent_by_content?: (data: Content) => Container | undefined;
		iterate: () => Iterator<Container, void, void>;
		merge_container?: (n1: Container, n2: Container) => Container;
		merge_content_into?: (d1: Content, d2: Content) => Content;
		name?: string;
		no_remove?: boolean;
		no_write?: boolean;
		on_add?: (v: Container) => void;
		on_remove?: (v: Container) => void;
		sort_content_by?: (...data: Content) => number;
	}) {
		super({
			are_equal_containers: are_equal_content
				? (n1, n2) => are_equal_content(n1.get(), n2.get())
				: undefined,
			are_equivalent_containers(n1, n2) {
				return are_equivalent_content(n1.get(), n2.get());
			},
			attach_container: attach,
			container_to_string: content_to_string
				? (n) => content_to_string(...n.get())
				: undefined,
			detach_container: detach,
			get_equal_container: get_equal_by_content
				? (n) => get_equal_by_content(n.get())
				: undefined,
			get_equivalent_container: get_equivalent_by_content
				? (n) => get_equivalent_by_content(n.get())
				: undefined,
			iterate_container: iterate,
			merge_into_container: merge_content_into
				? (n1, n2) => {
						const inserted_content = n2.get();
						const internal_content = n1.get();
						if (
							!this.are_equal_content(internal_content, inserted_content) &&
							this.are_equivalent_content(internal_content, inserted_content)
						) {
							if (this.no_write) {
								throw new Error(`${this} has read-only data.`);
							}

							const merged = merge_content_into(
								internal_content,
								inserted_content,
							);
							if (!this.are_equivalent_content(internal_content, merged)) {
								throw new Error("Merged data is not equivalent.");
							}

							n1.set(merged);
							n2.set(merged);
						}
						return merge_container?.(n1, n2) ?? n2;
					}
				: undefined,
			name,
			no_remove,
			no_write,
			on_add_container: on_add,
			on_remove_container: on_remove,
			sort_container_by: sort_content_by
				? (n: Container) => sort_content_by(...n.get())
				: undefined,
		});

		this.are_equivalent_content = (d1, d2) => are_equivalent_content(d1, d2);

		if (are_equal_content) {
			this.are_equal_content = (d1, d2) => are_equal_content(d1, d2);
		}

		if (get_equivalent_by_content) {
			this.get_equivalent_container_by_content = (data: Content) =>
				get_equivalent_by_content(data);
		}

		if (get_equal_by_content) {
			this.get_equal_container_by_content = (data: Content) =>
				get_equal_by_content(data);
		}

		if (container_constructor) {
			this.pair_constructor = container_constructor;
		}
	}

	are_equivalent_content(d1: Content, d2: Content): boolean {
		return d1 === d2;
	}

	are_equal_content(d1: Content, d2: Content): boolean {
		return d1 === d2;
	}

	get_equal_container_by_content: (data: Content) => Container | undefined = (
		data,
	): Container | undefined =>
		[...this].find((node) => this.are_equal_content(node.get(), data));

	get_equivalent_container_by_content: (
		data: Content,
	) => Container | undefined = (data) =>
		[...this].find((node) => this.are_equivalent_content(node.get(), data));
}

export class Spread_Stream<D extends any[]> extends Writable_Stream<D> {
	constructor(...data: D) {
		super(data);
	}
}
