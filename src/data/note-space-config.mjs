/**
 * Shared by the website and local editor; prefixes use Astro's generated note IDs.
 * @typedef {{slug: string, title: string, description: string, series: string[], pathPrefixes: Array<{prefix: string, series: string}>}} NoteSpace
 * @typedef {{id: string, data: {space?: string, series?: string, section?: string}}} Note
 */

/** @type {NoteSpace[]} */
export const NOTE_SPACES = [
	{
		slug: 'course-notes', title: 'Course Notes',
		description: '计算机系统与机器学习基础课程的长期笔记。',
		series: ['计算机组成原理', '操作系统', '编译原理', '计算机网络', '机器学习基础'],
		pathPrefixes: [{ prefix: '体系结构/', series: '体系结构' }],
	},
	{
		slug: 'pretrain', title: 'PreTraining',
		description: '模型、表示学习与训练算法的基础。',
		series: ['Transformer 笔记'], pathPrefixes: [],
	},
	{
		slug: 'posttrain', title: 'PostTraining',
		description: '对齐、指令微调与模型评测。',
		series: ['RL Algorithm'], pathPrefixes: [],
	},
	{
		slug: 'ai-infra', title: 'AI Infra',
		description: '支撑训练与推理的系统、通信、算子和硬件。',
		series: ['CCL'],
		pathPrefixes: [
			{ prefix: 'nccl/', series: 'NCCL' },
			{ prefix: 'vllm/', series: 'vLLM' },
			{ prefix: 'kernel/flashattention/', series: 'FlashAttention' },
			{ prefix: 'silicon--photons/', series: 'Silicon & Photons' },
			{ prefix: 'ai-communication/', series: 'AI Communication' },
		],
	},
	{
		slug: 'ai-product', title: 'AI Product',
		description: 'AI 产品设计、应用实践与体验观察。',
		series: [], pathPrefixes: [{ prefix: 'agent/', series: 'Agent & Prompt' }],
	},
];

/** @param {string} slug */
export function getNoteSpace(slug) {
	return NOTE_SPACES.find(space => space.slug === slug);
}

/** @param {Note} note @param {NoteSpace} space */
function pathSeries(note, space) {
	return space.pathPrefixes.find(({ prefix }) => note.id.startsWith(prefix) || note.id === prefix.replace(/\/$/, ''))?.series;
}

/** An explicit editor choice takes precedence over legacy series/path inference.
 * @param {Note} note
 */
export function getSpaceForNote(note) {
	const explicit = note.data.space && getNoteSpace(note.data.space);
	if (explicit) return explicit;
	const series = note.data.series ?? note.data.section;
	return NOTE_SPACES.find(space => (series && space.series.includes(series)) || pathSeries(note, space));
}

/** @param {Note} note @param {NoteSpace} space */
export function seriesNameForSpace(note, space) {
	return pathSeries(note, space) ?? note.data.series ?? note.data.section ?? 'Notes';
}
