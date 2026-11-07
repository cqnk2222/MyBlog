/** Following 的主题分类；页面、内容 schema 和本地编辑器共用。 */
export const FOLLOWING_CATEGORIES = [
	{
		slug: 'research',
		title: 'Research',
		label: '研究',
		question: '理解新的想法',
		description: '从论文、综述和研究者的记录里，跟进新的问题与方法。',
		topics: ['论文与综述', '研究团队', 'AI Labs'],
	},
	{
		slug: 'engineering',
		title: 'Engineering',
		label: '工程',
		question: '把想法做出来',
		description: '关注系统如何实现、工具怎样使用，以及实践中的取舍。',
		topics: ['AI 工程', '系统与基础设施', '开发工具'],
	},
	{
		slug: 'design',
		title: 'Design',
		label: '设计',
		question: '让体验更好一些',
		description: '收集关于界面、交互与视觉表达的思考，留意让人会心的细节。',
		topics: ['界面与交互', '产品体验', '视觉表达'],
	},
];

export function getFollowingCategory(slug) {
	return FOLLOWING_CATEGORIES.find(category => category.slug === slug);
}

/** loader 传入的分类内相对文件路径作为 ID，完整保留目录、文件名与扩展名。 */
export function followingEntryId(entry) {
	return entry.replace(/\\/g, '/');
}

/** 页面和 API 使用完整文件名作为锚点，避免 .md 与 .mdx 来源重名。 */
export function followingEntryAnchor(filePath) {
	return filePath.replace(/\\/g, '/').replace(/^(?:src\/content\/)?following\//, '');
}
