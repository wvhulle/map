export const table = <T extends object>(arr: T[]) => {
	if (arr.length > 0) {
		const keys = Object.keys(arr[0]!);
		const horizontalLine = "\r\n" + "-".repeat(8 * keys.length) + "\r\n";
		const heading = Object.keys(arr[0]!).join("\t");

		let str = horizontalLine;
		str += heading;

		arr.forEach((obj) => {
			str += horizontalLine + Object.values(obj).join("\t\t");
		});
		str += horizontalLine;
		return str;
	} else {
		return "";
	}

	//   console.log('%c' + str, 'font-family: monospace');
};
