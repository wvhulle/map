export function* filter<T>(
	iterable: Iterator<T>,
	predicate: (t: T, i?: number) => boolean,
) {
	for (let result = iterable.next(); !result.done; result = iterable.next()) {
		if (predicate(result.value)) {
			yield result.value;
		}
	}
	return undefined;
}

export function* map<T, V>(
	iterable: Iterator<T>,
	fn: (t: T, i?: number) => V,
): IterableIterator<V> {
	for (let result = iterable.next(); !result.done; result = iterable.next()) {
		yield fn(result.value);
	}
	return undefined;
}
