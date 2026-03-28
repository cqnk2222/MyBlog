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

export const noteSpaces: NoteSpaceLink[] = [
	{
		title: '计算机网络',
		href: 'https://bu-shi-mao-zhong-pian-ai-ju.gitbook.io/ji-suan-ji-wang-luo/',
	},
	{
		title: '编译原理',
		href: 'https://bu-shi-mao-zhong-pian-ai-ju.gitbook.io/bian-yi-yuan-li/',
	},
	{
		title: '数据库概论CMU 15-445',
		href: 'https://bu-shi-mao-zhong-pian-ai-ju.gitbook.io/shu-ju-ku-gai-lun-cmu-15445/',
	},
	{
		title: 'About AI',
		href: 'https://bu-shi-mao-zhong-pian-ai-ju.gitbook.io/about-ai/',
	},
	{
		title: 'Rust',
		href: 'https://bu-shi-mao-zhong-pian-ai-ju.gitbook.io/rust/',
	},
	{
		title: 'AI Research',
		href: 'https://bu-shi-mao-zhong-pian-ai-ju.gitbook.io/ai-research/',
	},
];

export function sortNotes(notes: NoteEntry[]) {
	return [...notes].sort((a, b) => {
		if (a.data.section !== b.data.section) {
			return a.data.section.localeCompare(b.data.section);
		}
		return a.data.order - b.data.order;
	});
}

export function buildNoteSections(notes: NoteEntry[]): NoteSectionGroup[] {
	const grouped = new Map<string, NoteNavItem[]>();

	for (const note of sortNotes(notes)) {
		const list = grouped.get(note.data.section) ?? [];
		list.push({
			id: note.id,
			title: note.data.title,
			chapter: note.data.chapter,
			section: note.data.section,
			fallbackUrl: `/notes/${note.id}/`,
		});
		grouped.set(note.data.section, list);
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
