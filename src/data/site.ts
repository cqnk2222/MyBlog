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

export const myLinks = [
	{ label: 'GitHub', href: 'https://github.com/cqnk2222', description: 'Code, experiments, and project repositories.' },
	{ label: 'Site', href: 'https://kk2222.ink', description: 'Notes, essays, and project updates.' },
	{ label: 'RSS', href: '/rss.xml', description: 'Follow new posts through your reader.' },
];

export const friendLinks = [
	{ label: 'Add your first friend link', href: '#', description: 'Replace this placeholder with a real site you want to recommend.' },
];

export const profile = {
	name: 'YangHao',
	location: 'China / Beijing',
	github: 'https://github.com/cqnk2222',
	intro:
		"Hello, I'm YangHao, a computer science student at Peking University. I'm interested in large language models, literature, and building a thoughtful space for notes and writing.",
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
