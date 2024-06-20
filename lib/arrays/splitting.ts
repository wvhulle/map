import { modulo } from "./indexing.js";

export function split(array: unknown[], sub_list_length: number) {
	console.log(
		`cutting array of length ${array.length} in pieces of length ${sub_list_length}`,
	);
	const pieces = [];
	let piece = [];
	if (sub_list_length <= array.length) {
		for (let i = 0; i < array.length; i++) {
			if (i > 0 && modulo(i, sub_list_length) === 0) {
				pieces.push(piece);
				piece = [];
				if (i + sub_list_length > array.length && i + 1 < array.length) {
					pieces.push(array.slice(i + 1, array.length));
				}
			} else {
				piece.push(array[i]);
			}
		}
	} else {
		pieces.push(array);
	}
	// console.log(`${pieces.length} pieces, pieces[0] ${JSON.stringify(pieces[0])}`)
	return pieces;
}
