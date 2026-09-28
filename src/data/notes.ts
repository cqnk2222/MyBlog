import type { CollectionEntry } from 'astro:content';

export type NoteEntry = CollectionEntry<'notes'>;

export interface NoteNavItem {
	id: string;
	title: string;
	chapter: string;
	section: string;
	gitbookUrl?: string;
	fallbackUrl: string;
}

export interface NoteSectionGroup {
	section: string;
	items: NoteNavItem[];
}

export interface NoteSpaceLink {
	title: string;
	href: string;
}

export interface NoteTreeItem {
	kind: 'item';
	id: string;
	title: string;
	order: number;
	active: boolean;
}

export interface NoteTreeGroup {
	kind: 'group';
	key: string;
	title: string;
	order: number;
	active: boolean;
	children: NoteTreeNode[];
}

export type NoteTreeNode = NoteTreeItem | NoteTreeGroup;

export function sortNotes(notes: NoteEntry[]) {
	return [...notes].sort((a, b) => {
		const sectionA = a.data.section ?? '';
		const sectionB = b.data.section ?? '';
		if (sectionA !== sectionB) {
			return sectionA.localeCompare(sectionB);
		}
		return (a.data.order ?? 0) - (b.data.order ?? 0);
	});
}

export interface NoteSeriesGroup {
	series: string;
	count: number;
	firstNoteId: string;
	notes: NoteEntry[];
}

/**
 * 按 `series` 字段把笔记分组，每组按 `order` 排序。
 * 用于 Notes 首页列出各系列，并链接到该系列第一篇。
 */
export function buildNoteSeries(notes: NoteEntry[]): NoteSeriesGroup[] {
	const grouped = new Map<string, NoteEntry[]>();

	for (const note of notes) {
		const series = note.data.series ?? note.data.section ?? 'Notes';
		const list = grouped.get(series) ?? [];
		list.push(note);
		grouped.set(series, list);
	}

	return Array.from(grouped.entries())
		.map(([series, items]) => {
			const sorted = items.sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0));
			return {
				series,
				count: sorted.length,
				firstNoteId: sorted[0]?.id ?? '',
				notes: sorted,
			};
		})
		.sort((a, b) => a.series.localeCompare(b.series, 'zh-Hans-CN'));
}

function getSharedPathPrefix(notes: NoteEntry[]) {
	if (notes.length === 0) return [];

	const pathParts = notes.map((note) => note.id.split('/').slice(0, -1));
	const [firstPath] = pathParts;
	const prefix: string[] = [];

	for (const [index, part] of firstPath.entries()) {
		if (pathParts.every((currentPath) => currentPath[index] === part)) {
			prefix.push(part);
		} else {
			break;
		}
	}

	return prefix;
}

function getSortablePrefix(segment: string) {
	const match = segment.match(/^(\d+)/);
	return match ? Number(match[1]) : undefined;
}

function formatPathSegment(segment: string) {
	const withoutPrefix = segment.replace(/^\d+[_-]?/, '');
	const words = withoutPrefix
		.replace(/[_-]+/g, ' ')
		.trim()
		.split(/\s+/)
		.filter(Boolean);

	if (words.length === 0) return segment;

	return words
		.map((word) => {
			if (word.length <= 3 && word === word.toLowerCase()) {
				return word.toUpperCase();
			}
			return word.charAt(0).toUpperCase() + word.slice(1);
		})
		.join(' ');
}

function sortTreeNodes(nodes: NoteTreeNode[]) {
	nodes.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'zh-Hans-CN'));

	for (const node of nodes) {
		if (node.kind === 'group') {
			sortTreeNodes(node.children);
		}
	}

	return nodes;
}

export function buildNoteTree(notes: NoteEntry[], currentId: string): NoteTreeNode[] {
	const prefix = getSharedPathPrefix(notes);
	const root: NoteTreeNode[] = [];
	const groups = new Map<string, NoteTreeGroup>();

	for (const note of notes) {
		const parts = note.id.split('/').slice(prefix.length);
		const directories = parts.slice(0, -1);
		let siblings = root;
		let parentPath = '';

		for (const directory of directories) {
			const groupKey = parentPath ? `${parentPath}/${directory}` : directory;
			let group = groups.get(groupKey);

			if (!group) {
				group = {
					kind: 'group',
					key: groupKey,
					title: formatPathSegment(directory),
					order: Number.POSITIVE_INFINITY,
					active: false,
					children: [],
				};
				groups.set(groupKey, group);
				siblings.push(group);
			}

			// 目录取它内部所有笔记里最小的 order，这样文件夹会排在它内容该在的位置，
			// 跟同级的单篇笔记也能正确混排；笔记没写 order 时退回目录名的数字前缀。
			group.order = Math.min(group.order, note.data.order ?? getSortablePrefix(directory) ?? 0);

			if (note.id === currentId) {
				group.active = true;
			}

			siblings = group.children;
			parentPath = groupKey;
		}

		siblings.push({
			kind: 'item',
			id: note.id,
			title: note.data.title,
			order: note.data.order ?? 0,
			active: note.id === currentId,
		});
	}

	return sortTreeNodes(root);
}

export function buildNoteSections(notes: NoteEntry[]): NoteSectionGroup[] {
	const grouped = new Map<string, NoteNavItem[]>();

	for (const note of sortNotes(notes)) {
		const section = note.data.section ?? 'Notes';
		const list = grouped.get(section) ?? [];
		list.push({
			id: note.id,
			title: note.data.title,
			chapter: note.data.chapter ?? '',
			section,
			fallbackUrl: `/notes/${note.id}/`,
		});
		grouped.set(section, list);
	}

	return Array.from(grouped.entries()).map(([section, items]) => ({ section, items }));
}

export function getAdjacentNotes(notes: NoteEntry[], currentId: string) {
	const ordered = sortNotes(notes);
	const index = ordered.findIndex((note) => note.id === currentId);

	return {
		previous: index > 0 ? ordered[index - 1] : undefined,
		next: index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : undefined,
	};
}
