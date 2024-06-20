import { Stream_of_Sets } from "./stream_of_sets.js";

export class Queue<T> extends Stream_of_Sets<T> {
	constructor({ sort }: { sort: (t: T) => number }) {
		super({
			sort_by: sort,
		});
	}
	enqueue(item: T): void {
		super.add_and_replace_equal(item);
	}

	dequeue(): T | undefined {
		const array = this.get();
		if (array.length > 0) {
			const item = array[0]!;
			this.remove_equal(item);
			return item;
		} else {
			return undefined;
		}
	}

	peek(): T | undefined {
		return this.get()[0];
	}

	isEmpty(): boolean {
		return this.get().length === 0;
	}
}
