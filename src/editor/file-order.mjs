/** Parent articles participate in the same ordering as ordinary sibling files. */
export function orderedSiblingFiles(node) {
	return [...node.files, ...[...node.dirs.values()].flatMap(dir => dir.entry ? [dir.entry] : [])]
		.sort((a, b) => {
			const order = file => Number.isFinite(file.order) ? file.order : 0;
			return order(a) - order(b) || a.title.localeCompare(b.title, 'zh-Hans-CN') || a.path.localeCompare(b.path);
		});
}

export function findSiblingFiles(node, filePath) {
	const siblings = orderedSiblingFiles(node);
	if (siblings.some(file => file.path === filePath)) return siblings;
	for (const child of node.dirs.values()) {
		const found = findSiblingFiles(child, filePath);
		if (found.length) return found;
	}
	return [];
}

export function moveSibling(paths, filePath, direction) {
	const result = [...paths];
	const from = result.indexOf(filePath);
	const to = from + (direction === 'up' ? -1 : 1);
	if (from >= 0 && to >= 0 && to < result.length) [result[from], result[to]] = [result[to], result[from]];
	return result;
}
