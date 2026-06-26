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
