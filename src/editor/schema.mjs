/**
 * 编辑器表单的字段定义 —— 与 src/content.config.ts 的 zod schema 保持一致。
 * 纯数据模块，服务端（api.mjs）和页面（EditorPage.astro）共用。
 * 新增 collection 字段时，记得同步修改 content.config.ts。
 */

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
		// 所有条目渲染在 /following 一个页面上，没有单条详情页
		singlePage: true,
		newBody: '为什么关注：\n',
		fields: [
			{ key: 'name', label: '名称', type: 'text', required: true, primary: true },
			{
				key: 'url',
				label: '主页链接',
				type: 'text',
				required: true,
				placeholder: 'https://example.com',
				// 新建时先占位，否则 zod 的 url() 校验会让整个站构建失败
				newDefault: 'https://example.com',
			},
			{
				key: 'kind',
				label: '类型',
				type: 'select',
				required: true,
				options: [
					{ value: 'blog', label: '个人博客' },
					{ value: 'newsletter', label: 'Newsletter' },
					{ value: 'group', label: '研究团队' },
					{ value: 'lab', label: 'AI Lab' },
					{ value: 'friend', label: '友链' },
				],
			},
			{ key: 'org', label: '所属机构', type: 'text', suggest: 'org', placeholder: '个人博客可留空' },
			{ key: 'rss', label: 'RSS', type: 'text', placeholder: 'https://…/feed.xml' },
			{ key: 'addedDate', label: '添加日期', type: 'date', required: true },
			{ key: 'active', label: '仍在更新', type: 'boolean', newDefault: true },
			{ key: 'tags', label: 'Tags', type: 'tags' },
		],
	},
};

/** frontmatter 写回文件时的字段顺序；schema 之外的字段（如 heroImage）追加在后面并原样保留。 */
export function fieldOrder(collection) {
	return (COLLECTIONS[collection]?.fields ?? []).map((field) => field.key);
}
