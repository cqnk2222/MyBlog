export const projects = [
	{
		title: 'Research Agent Playground',
		summary: 'A sandbox for testing retrieval, multi-agent workflows, and LLM tool use in research tasks.',
		stack: ['Astro', 'TypeScript', 'Python'],
		status: 'In progress',
		github: 'https://github.com/cqnk2222',
		demo: '',
	},
	{
		title: 'Course Notes System',
		summary: 'A structured note-taking workflow for AI courses, papers, and implementation details.',
		stack: ['Markdown', 'Astro Content Collections'],
		status: 'Active',
		github: 'https://github.com/cqnk2222',
		demo: '',
	},
	{
		title: 'Personal Blog Infrastructure',
		summary: 'The codebase behind this site, used to organize notes, essays, project logs, and links.',
		stack: ['Astro', 'MDX'],
		status: 'Active',
		github: 'https://github.com/cqnk2222/MyBlog',
		demo: 'https://kk2222.ink',
	},
];

// myLinks / friendLinks 已随 /links 页面移除：
// 前者首页 Elsewhere 区块已有，后者改成 src/content/following/ 里 kind: 'friend' 的条目。

export const profile = {
	name: 'Krinein Hao',
	location: 'China / Beijing',
	github: 'https://github.com/cqnk2222',
	avatar: '/avatar.jpg',
	intro:
		"Hello, I'm Krinein Hao, a computer science student at Peking University. I'm interested in large language models, literature, and building a thoughtful space for notes and writing.",
};

export const education = [
	{
		school: '北京大学',
		detail: '信息与计算科学',
		period: 'August 2023 - Present',
		badge: '/badges/pku.svg',
		accent: '#8b1e2d',
		href: '#',
	},
	{
		school: '重庆南开中学',
		detail: '高中',
		period: 'August 2017 - July 2023',
		badge: '/badges/nk.svg',
		accent: '#174a8b',
		href: '#',
	},
];
