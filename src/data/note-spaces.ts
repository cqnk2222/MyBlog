import type { NoteEntry, NoteSeriesGroup } from './notes';
import { createHash } from 'node:crypto';
import { getSpaceForNote } from './note-space-config.mjs';
export { NOTE_SPACES, getNoteSpace, seriesNameForSpace } from './note-space-config.mjs';
import { NOTE_SPACES, seriesNameForSpace } from './note-space-config.mjs';

export interface NoteSpace {
	slug: string;
	title: string;
	description: string;
	series: string[];
	pathPrefixes: Array<{ prefix: string; series: string }>;
}

export interface NoteSpaceSeries extends NoteSeriesGroup {
	slug: string;
	href: string;
}

function topicSlug(title: string) {
	return title.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}_-]/gu, '') || 'notes';
}

export function isNoteInSpace(note: NoteEntry, space: NoteSpace) {
	return getSpaceForNote(note)?.slug === space.slug;
}

export function buildSpaceSeries(notes: NoteEntry[], space: NoteSpace): NoteSpaceSeries[] {
	const grouped = new Map<string, NoteEntry[]>();
	for (const note of notes.filter((entry) => isNoteInSpace(entry, space))) {
		const name = seriesNameForSpace(note, space);
		const items = grouped.get(name) ?? [];
		items.push(note);
		grouped.set(name, items);
	}

	const groups = Array.from(grouped.entries())
		.map(([series, items]) => {
			const sorted = items.sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0));
			return { series, count: sorted.length, firstNoteId: sorted[0]?.id ?? '', notes: sorted };
		})
		.sort((a, b) => a.series.localeCompare(b.series, 'zh-Hans-CN'));

	const slugCounts = new Map<string, number>();
	for (const group of groups) {
		const base = topicSlug(group.series);
		slugCounts.set(base, (slugCounts.get(base) ?? 0) + 1);
	}
	// Reserve natural names as well as generated slugs so every topic stays reachable.
	const usedSlugs = new Set(slugCounts.keys());
	return groups.map((group) => {
		const base = topicSlug(group.series);
		let slug = slugCounts.get(base)! > 1
			? `${base}-${createHash('sha256').update(group.series).digest('hex').slice(0, 10)}`
			: base;
		if (slug !== base) {
			const stem = slug;
			let suffix = 2;
			while (usedSlugs.has(slug)) slug = `${stem}-${suffix++}`;
		}
		usedSlugs.add(slug);
		return { ...group, slug, href: `/notes/${space.slug}/series/${slug}/` };
	});
}

export function buildUnsortedSeries(notes: NoteEntry[]) {
	const assigned = new Set(notes.filter((note) => NOTE_SPACES.some((space) => isNoteInSpace(note, space))).map((note) => note.id));
	const remaining = notes.filter((note) => !assigned.has(note.id));
	const grouped = new Map<string, NoteEntry[]>();
	for (const note of remaining) {
		const name = note.data.series ?? note.data.section ?? note.id.split('/')[0] ?? 'Notes';
		const items = grouped.get(name) ?? [];
		items.push(note);
		grouped.set(name, items);
	}
	return Array.from(grouped.entries()).map(([series, items]) => ({
		series,
		count: items.length,
		firstNoteId: items[0]?.id ?? '',
		notes: items,
	}));
}
