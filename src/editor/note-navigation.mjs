import { NOTE_SPACES, getSpaceForNote } from '../data/note-space-config.mjs';
import { FOLLOWING_CATEGORIES, getFollowingCategory } from '../data/following-config.mjs';

function directory(name, key, collection, dir = '', space = null, category = null) {
	return { name, key, collection, dir, space, category, dirs: new Map(), files: [] };
}

/** Keep the parent at its original URL and create a directory beside its file. */
export function getChildNoteContext(parent, files) {
	if (parent.collection !== 'notes' || !parent.path.startsWith('notes/')) throw new Error('请选择一篇笔记作为上级');
	const parts = parent.path.split('/').slice(1);
	const stem = parts.pop().replace(/\.mdx?$/, '');
	if (stem !== 'index') parts.push(stem);
	const dir = parts.join('/');
	const data = parent.frontmatter;
	const siblings = files.filter(file => file.collection === 'notes' && file.path !== parent.path && file.path.split('/').slice(1, -1).join('/') === dir);
	const orders = [data.order, ...siblings.map(file => file.order)].filter(Number.isFinite);
	const id = parent.url?.replace(/^\/notes\//, '').replace(/\/$/, '') ?? '';
	return {
		collection: 'notes', dir,
		space: getSpaceForNote({ id, data })?.slug ?? parent.space,
		series: data.series ?? data.section ?? parent.groupSeries ?? '',
		section: data.section ?? '',
		order: Math.max(0, siblings.length, ...orders) + 1,
		parentPath: parent.path, parentTitle: data.title,
	};
}

function attachParentEntries(node) {
	for (const [name, child] of node.dirs) {
		const parent = node.files.find(file => file.collection === 'notes' && file.path.split('/').at(-1).replace(/\.mdx?$/, '') === name);
		if (parent) {
			child.entry = parent;
			child.name = parent.title;
			node.files = node.files.filter(file => file !== parent);
		}
		attachParentEntries(child);
	}
}

/** Virtual category keys are separate from the real directory used for creation. */
export function buildEditorTree(files, { collection = 'all', search = '' } = {}) {
	const root = { dirs: new Map(), files: [] };
	let notesRoot;
	let followingRoot;
	if (files.some(file => file.collection === 'notes') || (!search.trim() && ['all', 'notes'].includes(collection))) {
		notesRoot = collection === 'notes' ? root : directory('Notes', 'notes', 'notes');
		if (notesRoot !== root) root.dirs.set('notes', notesRoot);
		for (const [index, space] of NOTE_SPACES.entries()) {
			const members = files.filter(file => file.collection === 'notes' && file.space === space.slug);
			if (search.trim() && !members.length) continue;
			const node = directory(space.title, `notes@${space.slug}`, 'notes', '', space.slug);
			node.sortOrder = index;
			node.count = members.length;
			notesRoot.dirs.set(space.slug, node);
		}
	}
	if (files.some(file => file.collection === 'following') || (!search.trim() && ['all', 'following'].includes(collection))) {
		followingRoot = collection === 'following' ? root : directory('Following', 'following', 'following');
		if (followingRoot !== root) root.dirs.set('following', followingRoot);
		for (const [index, category] of FOLLOWING_CATEGORIES.entries()) {
			const members = files.filter(file => file.collection === 'following' && file.category === category.slug);
			if (search.trim() && !members.length) continue;
			const node = directory(category.title, `following@${category.slug}`, 'following', '', null, category.slug);
			node.sortOrder = index;
			node.count = members.length;
			followingRoot.dirs.set(category.slug, node);
		}
	}

	for (const file of files) {
		let node;
		if (file.collection === 'notes') {
			const space = file.space || 'unclassified';
			if (!notesRoot.dirs.has(space)) {
				const unknown = directory('未分类', 'notes@unclassified', 'notes');
				unknown.count = files.filter(file => file.collection === 'notes' && !file.space).length;
				unknown.sortOrder = NOTE_SPACES.length;
				notesRoot.dirs.set(space, unknown);
			}
			node = notesRoot.dirs.get(space);
		} else if (file.collection === 'following') {
			const category = getFollowingCategory(file.category)?.slug || 'unclassified';
			if (!followingRoot.dirs.has(category)) {
				const unknown = directory('未分类', 'following@unclassified', 'following');
				unknown.count = files.filter(file => file.collection === 'following' && !getFollowingCategory(file.category)).length;
				unknown.sortOrder = FOLLOWING_CATEGORIES.length;
				followingRoot.dirs.set(category, unknown);
			}
			node = followingRoot.dirs.get(category);
		} else {
			if (!root.dirs.has(file.collection)) root.dirs.set(file.collection, directory(file.collection, file.collection, file.collection));
			node = root.dirs.get(file.collection);
		}

		const prefix = node.key;
		let dir = '';
		for (const segment of file.path.split('/').slice(1, -1)) {
			dir = dir ? `${dir}/${segment}` : segment;
			if (!node.dirs.has(segment)) node.dirs.set(segment, directory(segment, `${prefix}/${dir}`, file.collection, dir, file.space, node.category));
			node = node.dirs.get(segment);
		}
		node.files.push(file);
	}
	attachParentEntries(root);
	return root;
}

/** Expand the selected article's ancestors after opening a file or a hash link. */
export function expandFileAncestors(node, filePath, collapsed) {
	if (node.entry?.path === filePath || node.files.some(file => file.path === filePath)) return true;
	for (const child of node.dirs.values()) {
		if (expandFileAncestors(child, filePath, collapsed)) {
			collapsed.delete(child.key);
			return true;
		}
	}
	return false;
}
