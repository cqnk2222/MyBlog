/**
 * 编辑器表单的字段定义 —— 与 src/content.config.ts 的 zod schema 保持一致。
 * 纯数据模块，服务端（api.mjs）和页面（EditorPage.astro）共用。
 * 新增 collection 字段时，记得同步修改 content.config.ts。
 */
import { NOTE_SPACES } from '../data/note-space-config.mjs';
import { FOLLOWING_CATEGORIES } from '../data/following-config.mjs';

/** 编辑器接口挂载的前缀，页面和 dev 中间件共用。 */
export const API_PREFIX = '/__note-editor';

/** @type {Record<string, {label: string, dir: string, routeBase: string, fields: Array<Record<string, any>>}>} */
export const COLLECTIONS = {
	notes: {
		label: 'Notes',
		dir: 'notes',
		routeBase: '/notes',
		fields: [
			{ key: 'title', label: '标题', type: 'text', required: true, primary: true },
			{ key: 'description', label: '摘要', type: 'textarea', required: true },
			{
				key: 'space', label: '笔记分类', type: 'select',
				options: [{ value: '', label: '自动识别' }, ...NOTE_SPACES.map(space => ({ value: space.slug, label: space.title }))],
			},
			{ key: 'pubDate', label: '发布日期', type: 'date', required: true },
			{ key: 'updatedDate', label: '更新日期', type: 'date' },
			{ key: 'section', label: 'Section', type: 'text', suggest: 'section' },
			{ key: 'chapter', label: 'Chapter', type: 'text', placeholder: '01 · 章节名' },
			{ key: 'series', label: 'Series', type: 'text', suggest: 'series' },
			{ key: 'order', label: 'Order', type: 'number', placeholder: '101' },
			{ key: 'readingTime', label: '阅读时长', type: 'text', placeholder: '7 min read', autofill: 'readingTime' },
			{ key: 'tags', label: 'Tags', type: 'tags' },
		],
	},
	essays: {
		label: 'Essays',
		dir: 'essays',
		routeBase: '/essays',
		fields: [
			{ key: 'title', label: '标题', type: 'text', required: true, primary: true },
			{ key: 'titleEn', label: '英文副标题', type: 'text' },
			{ key: 'description', label: '摘要', type: 'textarea', required: true },
			{ key: 'pubDate', label: '发布日期', type: 'date', required: true },
			{ key: 'updatedDate', label: '更新日期', type: 'date' },
			{ key: 'author', label: '作者', type: 'text' },
			{ key: 'location', label: '写作地点', type: 'text', placeholder: '写于北京' },
		],
	},
	thoughts: {
		label: 'Thoughts',
		dir: 'thoughts',
		routeBase: '/thoughts',
		fields: [
			{ key: 'title', label: '标题', type: 'text', required: true, primary: true },
			{ key: 'description', label: '导语', type: 'textarea', required: true },
			{ key: 'pubDate', label: '发布日期', type: 'date', required: true },
			{ key: 'updatedDate', label: '更新日期', type: 'date' },
			{ key: 'tags', label: 'Tags', type: 'tags' },
		],
	},
	following: {
		label: 'Following',
		dir: 'following',
		routeBase: '/following',
		// 条目渲染在所属分类页，没有单条详情页
		singlePage: true,
		newBody: '',
		fields: [
			{ key: 'name', label: '名称', type: 'text', required: true, primary: true },
			{
				key: 'url',
				label: '主页链接',
				type: 'text',
				required: true,
				placeholder: 'https://example.com',
			},
			{
				key: 'category',
				label: '关注分类',
				type: 'select',
				required: true,
				options: FOLLOWING_CATEGORIES.map(category => ({ value: category.slug, label: category.title })),
			},
			{ key: 'org', label: '所属机构', type: 'text', suggest: 'org', placeholder: '个人博客可留空' },
			{ key: 'previewImage', label: '网站截图', type: 'image', placeholder: 'https://example.com/screenshot.webp（可选）', help: '上传截图，或填写图片直链。主页链接不会自动生成截图。' },
			{ key: 'rss', label: 'RSS', type: 'text', placeholder: 'https://…/feed.xml' },
			{ key: 'addedDate', label: '添加日期', type: 'date', required: true },
			{ key: 'active', label: '仍在更新', type: 'boolean', newDefault: true },
			{ key: 'tags', label: '标签', type: 'tags', placeholder: '自行填写，用逗号分隔' },
		],
	},
};

/** frontmatter 写回文件时的字段顺序；schema 之外的字段（如 heroImage）追加在后面并原样保留。 */
export function fieldOrder(collection) {
	return (COLLECTIONS[collection]?.fields ?? []).map((field) => field.key);
}
