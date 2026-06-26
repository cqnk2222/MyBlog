import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const notes = defineCollection({
	loader: glob({ base: './src/content/notes', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
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

export const collections = { notes, essays, thoughts };
