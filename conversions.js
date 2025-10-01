function sizeToMebibyte(value, includeLabel = true) {
	const MEBIBYTE_SIZE = 1024 ^ 2;
	return String((value / (MEBIBYTE_SIZE * 1000)).toFixed(2)) + (includeLabel ? " MiB" : "");
}
