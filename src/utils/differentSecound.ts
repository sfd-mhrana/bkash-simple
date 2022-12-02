export function diffSeconds(date: number): number {
	const diff = Date.now() - date;
	return diff / 1000;
}