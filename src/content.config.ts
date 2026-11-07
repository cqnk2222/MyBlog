import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { NOTE_SPACES } from './data/note-space-config.mjs';
import { FOLLOWING_CATEGORIES, followingEntryId } from './data/following-config.mjs';

const noteSpaceIds = NOTE_SPACES.map((space) => space.slug) as [string, ...string[]];
const followingCategoryIds = FOLLOWING_CATEGORIES.map((category) => category.slug) as [string, ...string[]];

const notes = defineCollection({
	loader: glob({ base: './src/content/notes', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			space: z.enum(noteSpaceIds).optional(),
			section: z.string().optional(), // 用于分组，如 "Transformer 笔记"
			chapter: z.string().optional(), // 用于显示，如 "01 · 张量与形状"
			series: z.string().optional(), // 系列名称，用于关联同一系列的笔记
			order: z.number().optional(), // 在系列中的顺序
			tags: z.array(z.string()).default([]),
			heroImage: image().optional(),
			readingTime: z.string().optional(), // 如 "8 min read"
		}),
});

const essays = defineCollection({
	loader: glob({ base: './src/content/essays', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			titleEn: z.string().optional(), // 英文副标题
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			author: z.string().optional(),
			location: z.string().optional(), // 如 "写于北京"
			coverImage: image().optional(),
		}),
});

const thoughts = defineCollection({
	loader: glob({ base: './src/content/thoughts', pattern: '**/*.{md,mdx}' }),
	schema: () =>
		z.object({
			title: z.string(),
			description: z.string(), // 导语 standfirst
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			tags: z.array(z.string()).default([]),
		}),
});

/**
 * 持续回访的来源。
 * 每条一个文件，正文写 1~3 句「为什么关注」。按 category 渲染到分类页，
 * 标签由用户自由填写，不生成单条详情页。
 */
const following = defineCollection({
	loader: glob({ base: './src/content/following', pattern: '**/*.{md,mdx}', generateId: ({ entry }) => followingEntryId(entry) }),
	schema: () =>
		z.object({
			name: z.string(),
			url: z.string().url(),
			category: z.enum(followingCategoryIds),
			previewImage: z.string().optional(),
			org: z.string().optional(), // 所属机构，个人博客一般留空
			tags: z.array(z.string()).default([]),
			rss: z.string().url().optional(),
			addedDate: z.coerce.date(),
			active: z.boolean().default(true), // false = 已停更，但还想留个记录
		}),
});

export const collections = { notes, essays, thoughts, following };
