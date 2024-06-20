/**
 * Calculates the modulus of two numbers, n and m.
 *
 * @param {number} index - The number to calculate the modulus of.
 * @param {number} bound - The number to divide by.
 * @return {number} The modulus of n and m.
 */
export function modulo(index: number, bound: number): number {
	if (bound !== Math.round(bound) || index !== Math.round(index)) {
		throw new Error(`n and m should be integers.`);
	}

	if (bound < 1) {
		throw new Error(`m should be at least 1 but it is ${bound}.`);
	}
	return ((index % bound) + bound) % bound;
}

export function first_free(integers: number[], start = 0) {
	let minimalFreeIndex =
		integers.length > 0 ? Math.max(...integers) + 1 : start;

	if (start <= minimalFreeIndex) {
		for (let i = 1; i <= minimalFreeIndex; i++) {
			if (!integers.includes(i)) {
				minimalFreeIndex = i;
				break;
			}
		}
	} else {
		minimalFreeIndex = start;
	}
	return minimalFreeIndex;
}
